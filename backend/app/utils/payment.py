"""
Payment gateway utilities
"""
import stripe
from typing import Optional, Dict, Any
from decimal import Decimal
from app.core.config import settings

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else None


class StripePaymentService:
    """Stripe payment service"""
    
    @staticmethod
    async def create_payment_intent(
        amount: Decimal,
        currency: str = "eur",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create Stripe payment intent"""
        try:
            # Convert to cents
            amount_cents = int(amount * 100)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                metadata=meta_data or {},
                automatic_payment_methods={
                    'enabled': True,
                }
            )
            
            return {
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'amount': amount,
                'currency': currency,
                'status': intent.status
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    async def confirm_payment(payment_intent_id: str) -> Dict[str, Any]:
        """Confirm payment intent"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'payment_intent_id': intent.id,
                'status': intent.status,
                'amount': Decimal(intent.amount) / 100,
                'currency': intent.currency,
                'charge_id': intent.charges.data[0].id if intent.charges.data else None
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    async def create_refund(
        charge_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create refund"""
        try:
            refund_params = {'charge': charge_id}
            
            if amount:
                refund_params['amount'] = int(amount * 100)
            
            if reason:
                refund_params['reason'] = reason
            
            refund = stripe.Refund.create(**refund_params)
            
            return {
                'refund_id': refund.id,
                'status': refund.status,
                'amount': Decimal(refund.amount) / 100,
                'currency': refund.currency
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")


class PayPalPaymentService:
    """PayPal payment service"""
    
    @staticmethod
    async def create_order(
        amount: Decimal,
        currency: str = "EUR",
        return_url: str = None,
        cancel_url: str = None
    ) -> Dict[str, Any]:
        """Create PayPal order"""
        # TODO: Implement PayPal SDK integration
        # This is a placeholder for PayPal integration
        raise NotImplementedError("PayPal integration not yet implemented")
    
    @staticmethod
    async def capture_order(order_id: str) -> Dict[str, Any]:
        """Capture PayPal order"""
        # TODO: Implement PayPal SDK integration
        raise NotImplementedError("PayPal integration not yet implemented")
    
    @staticmethod
    async def create_refund(
        capture_id: str,
        amount: Optional[Decimal] = None,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create PayPal refund"""
        # TODO: Implement PayPal SDK integration
        raise NotImplementedError("PayPal integration not yet implemented")


def generate_order_number() -> str:
    """Generate unique order number"""
    import random
    import string
    from datetime import datetime
    
    timestamp = datetime.now().strftime('%Y%m%d')
    random_suffix = ''.join(random.choices(string.digits, k=6))
    
    return f"ORD-{timestamp}-{random_suffix}"
