"""
Order notification service
"""
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template

from app.core.config import settings
from app.models.order import Order, OrderStatus


class OrderNotificationService:
    """Service for sending order-related emails"""
    
    @staticmethod
    async def send_order_confirmation(order: Order) -> bool:
        """Send order confirmation email"""
        subject = f"Order Confirmation #{order.order_number}"
        
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .order-details { background: white; padding: 15px; margin: 15px 0; border: 1px solid #ddd; }
                .item { border-bottom: 1px solid #eee; padding: 10px 0; }
                .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Thank You for Your Order!</h1>
                </div>
                <div class="content">
                    <p>Hi {{ customer_name }},</p>
                    <p>We've received your order and will send you updates when it ships.</p>
                    
                    <div class="order-details">
                        <h3>Order #{{ order_number }}</h3>
                        <p><strong>Order Date:</strong> {{ order_date }}</p>
                        <p><strong>Total:</strong> €{{ total_amount }}</p>
                        
                        <h4>Items:</h4>
                        {% for item in items %}
                        <div class="item">
                            <strong>{{ item.product_name }}</strong>
                            {% if item.variant_name %}({{ item.variant_name }}){% endif %}
                            <br>
                            Quantity: {{ item.quantity }} × €{{ item.unit_price }} = €{{ item.total_price }}
                        </div>
                        {% endfor %}
                        
                        <div class="total">
                            <p>Subtotal: €{{ subtotal }}</p>
                            {% if discount_amount > 0 %}
                            <p>Discount: -€{{ discount_amount }}</p>
                            {% endif %}
                            <p>Shipping: €{{ shipping_cost }}</p>
                            <p>Tax: €{{ tax_amount }}</p>
                            <p><strong>Total: €{{ total_amount }}</strong></p>
                        </div>
                    </div>
                    
                    <div class="order-details">
                        <h4>Shipping Address:</h4>
                        <p>
                            {{ shipping_address.line1 }}<br>
                            {% if shipping_address.line2 %}{{ shipping_address.line2 }}<br>{% endif %}
                            {{ shipping_address.city }}, {{ shipping_address.postal_code }}<br>
                            {{ shipping_address.country }}
                        </p>
                    </div>
                </div>
                <div class="footer">
                    <p>If you have any questions, please contact us.</p>
                    <p>&copy; {{ year }} All rights reserved</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        html_content = Template(template).render(
            customer_name=order.customer_name,
            order_number=order.order_number,
            order_date=order.created_at.strftime('%B %d, %Y'),
            total_amount=f"{order.total_amount:.2f}",
            items=[{
                'product_name': item.product_name,
                'variant_name': item.variant_name,
                'quantity': item.quantity,
                'unit_price': f"{item.unit_price:.2f}",
                'total_price': f"{item.total_price:.2f}"
            } for item in order.items],
            subtotal=f"{order.subtotal:.2f}",
            discount_amount=order.discount_amount,
            shipping_cost=f"{order.shipping_cost:.2f}",
            tax_amount=f"{order.tax_amount:.2f}",
            shipping_address={
                'line1': order.shipping_address_line1,
                'line2': order.shipping_address_line2,
                'city': order.shipping_city,
                'postal_code': order.shipping_postal_code,
                'country': order.shipping_country
            },
            year=datetime.now().year
        )
        
        return await OrderNotificationService._send_email(
            to_email=order.customer_email,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_payment_confirmation(order: Order) -> bool:
        """Send payment confirmation email"""
        subject = f"Payment Confirmed - Order #{order.order_number}"
        
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .success { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Confirmed!</h1>
                </div>
                <div class="content">
                    <div class="success">
                        <h2>✓ Your payment was successful</h2>
                    </div>
                    <p>Hi {{ customer_name }},</p>
                    <p>We've received your payment for order #{{ order_number }}.</p>
                    <p><strong>Amount Paid:</strong> €{{ total_amount }}</p>
                    <p><strong>Payment Date:</strong> {{ payment_date }}</p>
                    <p>Your order is now being processed and will be shipped soon.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        html_content = Template(template).render(
            customer_name=order.customer_name,
            order_number=order.order_number,
            total_amount=f"{order.total_amount:.2f}",
            payment_date=order.paid_at.strftime('%B %d, %Y %H:%M') if order.paid_at else 'N/A'
        )
        
        return await OrderNotificationService._send_email(
            to_email=order.customer_email,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_shipping_notification(order: Order) -> bool:
        """Send shipping notification email"""
        subject = f"Your Order Has Shipped - #{order.order_number}"
        
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .tracking { background: white; padding: 20px; border: 2px solid #FF9800; border-radius: 5px; margin: 20px 0; text-align: center; }
                .tracking-number { font-size: 24px; font-weight: bold; color: #FF9800; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📦 Your Order Has Shipped!</h1>
                </div>
                <div class="content">
                    <p>Hi {{ customer_name }},</p>
                    <p>Great news! Your order #{{ order_number }} is on its way!</p>
                    
                    {% if tracking_number %}
                    <div class="tracking">
                        <h3>Tracking Information</h3>
                        <p><strong>Carrier:</strong> {{ carrier }}</p>
                        <div class="tracking-number">{{ tracking_number }}</div>
                        <p>Use this tracking number to follow your package.</p>
                    </div>
                    {% endif %}
                    
                    <p><strong>Estimated Delivery:</strong> {{ estimated_delivery }}</p>
                    
                    <p>Your package is being delivered to:</p>
                    <p>
                        {{ shipping_address.line1 }}<br>
                        {% if shipping_address.line2 %}{{ shipping_address.line2 }}<br>{% endif %}
                        {{ shipping_address.city }}, {{ shipping_address.postal_code }}<br>
                        {{ shipping_address.country }}
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        html_content = Template(template).render(
            customer_name=order.customer_name,
            order_number=order.order_number,
            tracking_number=order.tracking_number,
            carrier=order.carrier or 'Standard Shipping',
            estimated_delivery='3-5 business days',
            shipping_address={
                'line1': order.shipping_address_line1,
                'line2': order.shipping_address_line2,
                'city': order.shipping_city,
                'postal_code': order.shipping_postal_code,
                'country': order.shipping_country
            }
        )
        
        return await OrderNotificationService._send_email(
            to_email=order.customer_email,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_delivery_confirmation(order: Order) -> bool:
        """Send delivery confirmation email"""
        subject = f"Order Delivered - #{order.order_number}"
        
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Order Delivered!</h1>
                </div>
                <div class="content">
                    <p>Hi {{ customer_name }},</p>
                    <p>Your order #{{ order_number }} has been delivered!</p>
                    <p>We hope you enjoy your purchase. If you have any questions or concerns, please don't hesitate to contact us.</p>
                    <p>Thank you for shopping with us!</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        html_content = Template(template).render(
            customer_name=order.customer_name,
            order_number=order.order_number
        )
        
        return await OrderNotificationService._send_email(
            to_email=order.customer_email,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_cancellation_notification(order: Order, reason: Optional[str] = None) -> bool:
        """Send order cancellation email"""
        subject = f"Order Cancelled - #{order.order_number}"
        
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f44336; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Cancelled</h1>
                </div>
                <div class="content">
                    <p>Hi {{ customer_name }},</p>
                    <p>Your order #{{ order_number }} has been cancelled.</p>
                    {% if reason %}
                    <p><strong>Reason:</strong> {{ reason }}</p>
                    {% endif %}
                    <p>If you paid for this order, you will receive a full refund within 5-7 business days.</p>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        html_content = Template(template).render(
            customer_name=order.customer_name,
            order_number=order.order_number,
            reason=reason
        )
        
        return await OrderNotificationService._send_email(
            to_email=order.customer_email,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def send_refund_notification(order: Order, refund_amount: Decimal, reason: Optional[str] = None) -> bool:
        """Send refund notification email"""
        subject = f"Refund Processed - Order #{order.order_number}"
        
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .refund-amount { font-size: 24px; font-weight: bold; color: #2196F3; text-align: center; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Refund Processed</h1>
                </div>
                <div class="content">
                    <p>Hi {{ customer_name }},</p>
                    <p>Your refund for order #{{ order_number }} has been processed.</p>
                    
                    <div class="refund-amount">€{{ refund_amount }}</div>
                    
                    {% if reason %}
                    <p><strong>Reason:</strong> {{ reason }}</p>
                    {% endif %}
                    
                    <p>The refund will appear in your account within 5-7 business days, depending on your payment method.</p>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        html_content = Template(template).render(
            customer_name=order.customer_name,
            order_number=order.order_number,
            refund_amount=f"{refund_amount:.2f}",
            reason=reason
        )
        
        return await OrderNotificationService._send_email(
            to_email=order.customer_email,
            subject=subject,
            html_content=html_content
        )
    
    @staticmethod
    async def _send_email(to_email: str, subject: str, html_content: str) -> bool:
        """Send email via SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = getattr(settings, 'SMTP_FROM', 'noreply@spotex.com')
            msg['To'] = to_email
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            if hasattr(settings, 'SMTP_HOST'):
                smtp_host = settings.SMTP_HOST
                smtp_port = getattr(settings, 'SMTP_PORT', 587)
                smtp_user = getattr(settings, 'SMTP_USER', None)
                smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
                
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    if smtp_user and smtp_password:
                        server.login(smtp_user, smtp_password)
                    server.send_message(msg)
                
                return True
            else:
                # Development: Just log
                print(f"[EMAIL] To: {to_email}, Subject: {subject}")
                return True
                
        except Exception as e:
            print(f"Email error: {str(e)}")
            return False
