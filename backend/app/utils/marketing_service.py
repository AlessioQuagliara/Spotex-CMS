"""
Marketing service for campaigns, referrals, and loyalty
"""
import random
import string
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from decimal import Decimal

from app.models.coupon import Coupon, CouponUsage, DiscountType
from app.models.marketing import (
    MarketingCampaign, ReferralProgram, ReferralCode, ReferralConversion,
    LoyaltyProgram, LoyaltyAccount, LoyaltyTransaction
)
from app.models.order import Order, PaymentStatus
from app.models.user import User


class CouponGeneratorService:
    """Service for generating coupon codes"""
    
    @staticmethod
    def generate_code(prefix: str = "", length: int = 8) -> str:
        """Generate random coupon code"""
        chars = string.ascii_uppercase + string.digits
        random_part = ''.join(random.choices(chars, k=length))
        
        if prefix:
            return f"{prefix}{random_part}"
        return random_part
    
    @staticmethod
    async def generate_bulk_coupons(
        db: AsyncSession,
        store_id: int,
        prefix: str,
        quantity: int,
        discount_type: DiscountType,
        discount_value: Decimal,
        valid_from: datetime,
        valid_until: Optional[datetime],
        max_uses_per_user: int = 1,
        minimum_purchase: Optional[Decimal] = None
    ) -> List[str]:
        """Generate multiple unique coupon codes"""
        codes = []
        
        for _ in range(quantity):
            # Generate unique code
            while True:
                code = CouponGeneratorService.generate_code(prefix=prefix)
                
                # Check if code exists
                result = await db.execute(
                    select(Coupon).where(Coupon.code == code)
                )
                if not result.scalar_one_or_none():
                    break
            
            # Create coupon
            coupon = Coupon(
                store_id=store_id,
                code=code,
                discount_type=discount_type,
                discount_value=float(discount_value),
                valid_from=valid_from,
                valid_until=valid_until,
                max_uses_per_user=max_uses_per_user,
                minimum_purchase=float(minimum_purchase) if minimum_purchase else None,
                is_active=True
            )
            db.add(coupon)
            codes.append(code)
        
        await db.commit()
        return codes


class ReferralService:
    """Service for referral program management"""
    
    @staticmethod
    async def create_referral_code(
        db: AsyncSession,
        program_id: int,
        user_id: int
    ) -> str:
        """Create unique referral code for user"""
        # Check if user already has a code
        result = await db.execute(
            select(ReferralCode).where(
                ReferralCode.program_id == program_id,
                ReferralCode.referrer_user_id == user_id
            )
        )
        existing_code = result.scalar_one_or_none()
        
        if existing_code:
            return existing_code.code
        
        # Generate unique code
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one()
        
        # Use first 4 chars of email + random
        base = user.email[:4].upper()
        while True:
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code = f"{base}{random_part}"
            
            result = await db.execute(
                select(ReferralCode).where(ReferralCode.code == code)
            )
            if not result.scalar_one_or_none():
                break
        
        # Create code
        referral_code = ReferralCode(
            program_id=program_id,
            referrer_user_id=user_id,
            code=code
        )
        db.add(referral_code)
        await db.commit()
        await db.refresh(referral_code)
        
        return code
    
    @staticmethod
    async def process_referral_conversion(
        db: AsyncSession,
        referral_code: str,
        referee_user_id: int,
        order_id: int
    ):
        """Process referral conversion and create rewards"""
        # Get referral code
        result = await db.execute(
            select(ReferralCode).where(ReferralCode.code == referral_code)
        )
        ref_code = result.scalar_one_or_none()
        
        if not ref_code or not ref_code.is_active:
            return
        
        # Get program
        program_result = await db.execute(
            select(ReferralProgram).where(ReferralProgram.id == ref_code.program_id)
        )
        program = program_result.scalar_one()
        
        if not program.is_active:
            return
        
        # Get order
        order_result = await db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = order_result.scalar_one()
        
        # Check minimum purchase
        if program.minimum_purchase and order.total_amount < program.minimum_purchase:
            return
        
        # Calculate rewards
        referrer_reward = ReferralService._calculate_reward(
            program.referrer_reward_type,
            program.referrer_reward_value,
            order.total_amount
        )
        
        referee_reward = ReferralService._calculate_reward(
            program.referee_reward_type,
            program.referee_reward_value,
            order.total_amount
        )
        
        # Create coupons for rewards
        referrer_coupon = None
        referee_coupon = None
        
        if program.referrer_reward_type in ['percentage', 'fixed_amount']:
            referrer_coupon = await ReferralService._create_reward_coupon(
                db,
                order.store_id,
                program.referrer_reward_type,
                referrer_reward,
                f"Referral reward for {ref_code.code}"
            )
        
        if program.referee_reward_type in ['percentage', 'fixed_amount']:
            referee_coupon = await ReferralService._create_reward_coupon(
                db,
                order.store_id,
                program.referee_reward_type,
                referee_reward,
                f"Welcome referral reward"
            )
        
        # Create conversion record
        conversion = ReferralConversion(
            referral_code_id=ref_code.id,
            referrer_user_id=ref_code.referrer_user_id,
            referee_user_id=referee_user_id,
            order_id=order_id,
            order_value=float(order.total_amount),
            referrer_reward=float(referrer_reward),
            referee_reward=float(referee_reward),
            referrer_coupon_id=referrer_coupon.id if referrer_coupon else None,
            referee_coupon_id=referee_coupon.id if referee_coupon else None
        )
        db.add(conversion)
        
        # Update referral code stats
        ref_code.total_uses += 1
        ref_code.total_revenue += float(order.total_amount)
        ref_code.total_rewards_earned += float(referrer_reward)
        
        await db.commit()
    
    @staticmethod
    def _calculate_reward(reward_type: str, reward_value: Decimal, order_amount: Decimal) -> Decimal:
        """Calculate reward amount"""
        if reward_type == 'percentage':
            return (order_amount * reward_value / 100)
        elif reward_type == 'fixed_amount':
            return reward_value
        return Decimal('0')
    
    @staticmethod
    async def _create_reward_coupon(
        db: AsyncSession,
        store_id: int,
        reward_type: str,
        reward_value: Decimal,
        description: str
    ) -> Coupon:
        """Create reward coupon"""
        code = CouponGeneratorService.generate_code(prefix="REF")
        
        discount_type = DiscountType.FIXED_AMOUNT if reward_type == 'fixed_amount' else DiscountType.PERCENTAGE
        
        coupon = Coupon(
            store_id=store_id,
            code=code,
            discount_type=discount_type,
            discount_value=float(reward_value),
            description=description,
            valid_from=datetime.now(),
            valid_until=datetime.now() + timedelta(days=90),
            max_uses=1,
            max_uses_per_user=1,
            is_active=True
        )
        db.add(coupon)
        await db.flush()
        return coupon


class LoyaltyService:
    """Service for loyalty program management"""
    
    @staticmethod
    async def get_or_create_account(
        db: AsyncSession,
        program_id: int,
        user_id: int
    ) -> LoyaltyAccount:
        """Get or create loyalty account"""
        result = await db.execute(
            select(LoyaltyAccount).where(
                LoyaltyAccount.program_id == program_id,
                LoyaltyAccount.user_id == user_id
            )
        )
        account = result.scalar_one_or_none()
        
        if not account:
            # Get program for signup bonus
            program_result = await db.execute(
                select(LoyaltyProgram).where(LoyaltyProgram.id == program_id)
            )
            program = program_result.scalar_one()
            
            account = LoyaltyAccount(
                program_id=program_id,
                user_id=user_id,
                current_points=program.signup_bonus,
                lifetime_points=program.signup_bonus
            )
            db.add(account)
            await db.flush()
            
            # Record signup bonus
            if program.signup_bonus > 0:
                transaction = LoyaltyTransaction(
                    account_id=account.id,
                    transaction_type='bonus',
                    points=program.signup_bonus,
                    description='Signup bonus'
                )
                db.add(transaction)
            
            await db.commit()
            await db.refresh(account)
        
        return account
    
    @staticmethod
    async def award_points_for_order(
        db: AsyncSession,
        program_id: int,
        user_id: int,
        order_id: int,
        order_amount: Decimal
    ):
        """Award loyalty points for order"""
        # Get program
        program_result = await db.execute(
            select(LoyaltyProgram).where(LoyaltyProgram.id == program_id)
        )
        program = program_result.scalar_one()
        
        if not program.is_active:
            return
        
        # Get or create account
        account = await LoyaltyService.get_or_create_account(db, program_id, user_id)
        
        # Calculate points
        points = int(order_amount * program.points_per_euro)
        
        if points > 0:
            # Add points
            account.current_points += points
            account.lifetime_points += points
            
            # Record transaction
            transaction = LoyaltyTransaction(
                account_id=account.id,
                transaction_type='earn',
                points=points,
                order_id=order_id,
                description=f'Purchase - Order #{order_id}',
                expires_at=datetime.now() + timedelta(days=365)  # Points expire in 1 year
            )
            db.add(transaction)
            
            await db.commit()
    
    @staticmethod
    async def redeem_points(
        db: AsyncSession,
        account_id: int,
        points: int
    ) -> Coupon:
        """Redeem loyalty points for coupon"""
        # Get account
        result = await db.execute(
            select(LoyaltyAccount).where(LoyaltyAccount.id == account_id)
        )
        account = result.scalar_one()
        
        # Get program
        program_result = await db.execute(
            select(LoyaltyProgram).where(LoyaltyProgram.id == account.program_id)
        )
        program = program_result.scalar_one()
        
        # Validate
        if points < program.minimum_redemption_points:
            raise ValueError(f"Minimum redemption is {program.minimum_redemption_points} points")
        
        if points > account.current_points:
            raise ValueError("Insufficient points")
        
        # Calculate value
        value = Decimal(str(points)) * program.points_value
        
        # Create coupon
        code = CouponGeneratorService.generate_code(prefix="LOYALTY")
        
        # Get user's store_id from first order
        order_result = await db.execute(
            select(Order.store_id).where(Order.user_id == account.user_id).limit(1)
        )
        store_id = order_result.scalar() or 1
        
        coupon = Coupon(
            store_id=store_id,
            code=code,
            discount_type=DiscountType.FIXED_AMOUNT,
            discount_value=float(value),
            description=f'Loyalty reward - {points} points',
            valid_from=datetime.now(),
            valid_until=datetime.now() + timedelta(days=90),
            max_uses=1,
            max_uses_per_user=1,
            is_active=True
        )
        db.add(coupon)
        await db.flush()
        
        # Deduct points
        account.current_points -= points
        account.points_redeemed += points
        
        # Record transaction
        transaction = LoyaltyTransaction(
            account_id=account.id,
            transaction_type='redeem',
            points=-points,
            description=f'Redeemed for €{value:.2f} coupon'
        )
        db.add(transaction)
        
        await db.commit()
        await db.refresh(coupon)
        
        return coupon
