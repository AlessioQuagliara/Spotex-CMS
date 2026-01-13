"""
Checkout and order endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import joinedload
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod, Payment, OrderStatusHistory
from app.models.product import Product, ProductVariant
from app.models.coupon import Coupon, CouponUsage, ShippingRate
from app.schemas.order import *
from app.utils.payment import StripePaymentService, PayPalPaymentService, generate_order_number
from app.utils.order_notifications import OrderNotificationService

router = APIRouter()


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    store_id: int,
    checkout_data: CheckoutRequest,
    x_session_id: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create order from cart"""
    # Get cart
    cart_query = select(Cart).options(joinedload(Cart.items).joinedload(CartItem.product))
    
    if current_user:
        cart_query = cart_query.where(Cart.user_id == current_user.id, Cart.store_id == store_id)
    else:
        if not x_session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session ID required for guest checkout"
            )
        cart_query = cart_query.where(Cart.session_id == x_session_id, Cart.store_id == store_id)
    
    cart_result = await db.execute(cart_query)
    cart = cart_result.scalar_one_or_none()
    
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    # Verify stock availability
    for item in cart.items:
        if item.product.track_inventory:
            available = item.product.inventory_quantity
            if item.variant_id:
                variant_result = await db.execute(
                    select(ProductVariant).where(ProductVariant.id == item.variant_id)
                )
                variant = variant_result.scalar_one_or_none()
                if variant:
                    available = variant.inventory_quantity
            
            if available < item.quantity and not item.product.allow_backorder:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {item.product.name}"
                )
    
    # Calculate totals
    subtotal = cart.subtotal
    discount_amount = Decimal('0')
    coupon = None
    
    # Apply coupon
    if cart.coupon_code:
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.code == cart.coupon_code, Coupon.store_id == store_id)
        )
        coupon = coupon_result.scalar_one_or_none()
        
        if coupon:
            is_valid, message = coupon.is_valid(
                user_id=current_user.id if current_user else None,
                cart_total=subtotal
            )
            
            if is_valid:
                discount_amount = coupon.calculate_discount(subtotal)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Coupon error: {message}"
                )
    
    # Calculate shipping
    shipping_cost = Decimal('0')
    shipping_result = await db.execute(
        select(ShippingRate).where(
            ShippingRate.name == checkout_data.shipping_method,
            ShippingRate.store_id == store_id,
            ShippingRate.is_active == True
        )
    )
    shipping_rate = shipping_result.scalar_one_or_none()
    
    if shipping_rate:
        # Calculate total weight
        total_weight = Decimal('0')
        for item in cart.items:
            if item.product.weight:
                total_weight += Decimal(str(item.product.weight)) * item.quantity
        
        shipping_cost = shipping_rate.calculate_shipping(
            subtotal - discount_amount,
            total_weight,
            checkout_data.shipping_address.country
        )
    
    # Calculate tax (simplified - should be based on location)
    tax_rate = Decimal('0.22')  # 22% VAT example
    tax_amount = (subtotal - discount_amount + shipping_cost) * tax_rate
    
    # Total
    total_amount = subtotal - discount_amount + shipping_cost + tax_amount
    
    # Create order
    order_number = generate_order_number()
    billing_address = checkout_data.billing_address or checkout_data.shipping_address
    
    order = Order(
        order_number=order_number,
        store_id=store_id,
        user_id=current_user.id if current_user else None,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        customer_email=checkout_data.customer_email,
        customer_name=checkout_data.customer_name,
        customer_phone=checkout_data.customer_phone,
        shipping_address_line1=checkout_data.shipping_address.line1,
        shipping_address_line2=checkout_data.shipping_address.line2,
        shipping_city=checkout_data.shipping_address.city,
        shipping_state=checkout_data.shipping_address.state,
        shipping_country=checkout_data.shipping_address.country,
        shipping_postal_code=checkout_data.shipping_address.postal_code,
        billing_address_line1=billing_address.line1,
        billing_address_line2=billing_address.line2,
        billing_city=billing_address.city,
        billing_state=billing_address.state,
        billing_country=billing_address.country,
        billing_postal_code=billing_address.postal_code,
        subtotal=float(subtotal),
        shipping_cost=float(shipping_cost),
        tax_amount=float(tax_amount),
        discount_amount=float(discount_amount),
        total_amount=float(total_amount),
        coupon_code=cart.coupon_code,
        shipping_method=checkout_data.shipping_method,
        customer_notes=checkout_data.customer_notes,
        metadata=checkout_data.meta_data
    )
    
    db.add(order)
    await db.flush()
    
    # Create order items
    for cart_item in cart.items:
        variant_name = None
        if cart_item.variant_id:
            variant_result = await db.execute(
                select(ProductVariant).where(ProductVariant.id == cart_item.variant_id)
            )
            variant = variant_result.scalar_one_or_none()
            if variant:
                variant_name = variant.name
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=cart_item.product_id,
            variant_id=cart_item.variant_id,
            product_name=cart_item.product.name,
            product_sku=cart_item.product.sku,
            variant_name=variant_name,
            quantity=cart_item.quantity,
            unit_price=float(cart_item.price),
            total_price=float(cart_item.total_price),
            custom_options=cart_item.custom_options
        )
        db.add(order_item)
        
        # Update inventory
        if cart_item.product.track_inventory:
            cart_item.product.inventory_quantity -= cart_item.quantity
            
            if cart_item.variant_id:
                variant_result = await db.execute(
                    select(ProductVariant).where(ProductVariant.id == cart_item.variant_id)
                )
                variant = variant_result.scalar_one_or_none()
                if variant:
                    variant.inventory_quantity -= cart_item.quantity
    
    # Record coupon usage
    if coupon:
        coupon.current_usage += 1
        
        coupon_usage = CouponUsage(
            coupon_id=coupon.id,
            order_id=order.id,
            user_id=current_user.id if current_user else None,
            discount_amount=float(discount_amount)
        )
        db.add(coupon_usage)
    
    # Create status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        new_status=OrderStatus.PENDING,
        note="Order created",
        changed_by=current_user.id if current_user else None
    )
    db.add(status_history)
    
    # Clear cart
    for item in cart.items:
        await db.delete(item)
    cart.coupon_code = None
    
    await db.commit()
    await db.refresh(order)
    
    # Load order with items
    order_result = await db.execute(
        select(Order)
        .options(joinedload(Order.items))
        .where(Order.id == order.id)
    )
    order = order_result.scalar_one()
    
    # Send order confirmation email
    try:
        await OrderNotificationService.send_order_confirmation(order)
    except Exception as e:
        print(f"Failed to send order confirmation email: {e}")
    
    return order


@router.post("/orders/{order_id}/payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    order_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create Stripe payment intent for order"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify access
    if current_user and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    if order.payment_status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )
    
    # Create payment intent
    try:
        intent_data = await StripePaymentService.create_payment_intent(
            amount=Decimal(str(order.total_amount)),
            currency="eur",
            metadata={
                'order_id': order.id,
                'order_number': order.order_number
            }
        )
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            payment_method=PaymentMethod.STRIPE,
            payment_status=PaymentStatus.PENDING,
            amount=order.total_amount,
            currency="EUR",
            stripe_payment_intent_id=intent_data['payment_intent_id']
        )
        db.add(payment)
        await db.commit()
        
        return PaymentIntentResponse(
            client_secret=intent_data['client_secret'],
            payment_intent_id=intent_data['payment_intent_id'],
            amount=Decimal(str(order.total_amount)),
            currency="EUR"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment error: {str(e)}"
        )


@router.post("/orders/{order_id}/confirm-payment")
async def confirm_payment(
    order_id: int,
    payment_data: ConfirmPaymentRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Confirm payment and update order status"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify access
    if current_user and order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    try:
        if payment_data.payment_intent_id:
            # Confirm Stripe payment
            payment_result = await StripePaymentService.confirm_payment(payment_data.payment_intent_id)
            
            if payment_result['status'] == 'succeeded':
                # Update payment record
                payment_record_result = await db.execute(
                    select(Payment).where(
                        Payment.stripe_payment_intent_id == payment_data.payment_intent_id
                    )
                )
                payment_record = payment_record_result.scalar_one_or_none()
                
                if payment_record:
                    payment_record.payment_status = PaymentStatus.COMPLETED
                    payment_record.stripe_charge_id = payment_result.get('charge_id')
                    payment_record.completed_at = datetime.now()
                
                # Update order
                order.payment_status = PaymentStatus.COMPLETED
                order.status = OrderStatus.PAID
                order.paid_at = datetime.now()
                
                # Add status history
                status_history = OrderStatusHistory(
                    order_id=order.id,
                    old_status=OrderStatus.PENDING,
                    new_status=OrderStatus.PAID,
                    note="Payment confirmed"
                )
                db.add(status_history)
                
                await db.commit()
                
                # Send payment confirmation email
                try:
                    await OrderNotificationService.send_payment_confirmation(order)
                except Exception as e:
                    print(f"Failed to send payment confirmation email: {e}")
                
                return {"message": "Payment confirmed successfully"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Payment not successful: {payment_result['status']}"
                )
        
        # TODO: Add PayPal confirmation logic
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment confirmation error: {str(e)}"
        )


@router.get("/orders", response_model=PaginatedOrderResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[OrderStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user orders"""
    filters = [Order.user_id == current_user.id]
    
    if status_filter:
        filters.append(Order.status == status_filter)
    
    # Count total
    count_result = await db.execute(
        select(func.count(Order.id)).where(and_(*filters))
    )
    total = count_result.scalar()
    
    # Get orders
    query = (
        select(Order)
        .where(and_(*filters))
        .order_by(desc(Order.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Build response
    items = []
    for order in orders:
        items_count_result = await db.execute(
            select(func.sum(OrderItem.quantity)).where(OrderItem.order_id == order.id)
        )
        items_count = items_count_result.scalar() or 0
        
        items.append(OrderListResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            payment_status=order.payment_status,
            customer_name=order.customer_name,
            customer_email=order.customer_email,
            total_amount=Decimal(str(order.total_amount)),
            items_count=items_count,
            created_at=order.created_at
        ))
    
    return PaginatedOrderResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order details"""
    result = await db.execute(
        select(Order)
        .options(joinedload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify access
    if current_user and order.user_id != current_user.id:
        if not current_user.is_superuser:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    return order


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_data: UpdateOrderStatusRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update order status (admin only)"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    old_status = order.status
    order.status = status_data.status
    
    # Update timestamps and send notifications
    if status_data.status == OrderStatus.SHIPPED:
        order.shipped_at = datetime.now()
        try:
            await OrderNotificationService.send_shipping_notification(order)
        except Exception as e:
            print(f"Failed to send shipping notification: {e}")
    elif status_data.status == OrderStatus.DELIVERED:
        order.delivered_at = datetime.now()
        try:
            await OrderNotificationService.send_delivery_confirmation(order)
        except Exception as e:
            print(f"Failed to send delivery confirmation: {e}")
    elif status_data.status == OrderStatus.CANCELLED:
        order.cancelled_at = datetime.now()
        try:
            await OrderNotificationService.send_cancellation_notification(order, status_data.note)
        except Exception as e:
            print(f"Failed to send cancellation notification: {e}")
    
    # Add status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        old_status=old_status,
        new_status=status_data.status,
        note=status_data.note,
        changed_by=current_user.id
    )
    db.add(status_history)
    
    await db.commit()
    await db.refresh(order)
    
    return order


@router.put("/orders/{order_id}/shipping", response_model=OrderResponse)
async def update_shipping_info(
    order_id: int,
    shipping_data: UpdateShippingRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update order shipping info (admin only)"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.tracking_number = shipping_data.tracking_number
    order.carrier = shipping_data.carrier
    
    should_notify = False
    if order.status == OrderStatus.PAID or order.status == OrderStatus.PROCESSING:
        order.status = OrderStatus.SHIPPED
        order.shipped_at = datetime.now()
        should_notify = True
    
    await db.commit()
    await db.refresh(order)
    
    # Send shipping notification
    if should_notify:
        try:
            await OrderNotificationService.send_shipping_notification(order)
        except Exception as e:
            print(f"Failed to send shipping notification: {e}")
    
    return order
