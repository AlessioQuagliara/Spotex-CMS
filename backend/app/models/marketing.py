"""
Marketing models for campaigns and promotions
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, JSON, Boolean, Index
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from decimal import Decimal

from app.database import Base


class MarketingCampaign(Base):
    """Marketing campaign"""
    __tablename__ = "marketing_campaigns"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # Campaign details
    name: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[Optional[str]] = Column(Text)
    campaign_type: Mapped[str] = Column(String(50), nullable=False)  # email, social, referral, seasonal
    status: Mapped[str] = Column(String(20), default="draft")  # draft, active, paused, completed
    
    # Targeting
    target_segment: Mapped[Optional[str]] = Column(String(50))  # all, new_customers, loyal, at_risk, etc.
    target_customers: Mapped[Optional[str]] = Column(JSON)  # List of customer IDs
    
    # Schedule
    start_date: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    # Budget and goals
    budget: Mapped[Optional[float]] = Column(Numeric(10, 2))
    revenue_goal: Mapped[Optional[float]] = Column(Numeric(10, 2))
    orders_goal: Mapped[Optional[int]] = Column(Integer)
    
    # Results
    total_sent: Mapped[int] = Column(Integer, default=0)
    total_opened: Mapped[int] = Column(Integer, default=0)
    total_clicked: Mapped[int] = Column(Integer, default=0)
    total_conversions: Mapped[int] = Column(Integer, default=0)
    total_revenue: Mapped[float] = Column(Numeric(12, 2), default=0)
    
    # Associated coupon (optional)
    coupon_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("coupons.id"))
    
    # Metadata
    meta_data: Mapped[Optional[str]] = Column(JSON)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    coupon: Mapped[Optional["Coupon"]] = relationship("Coupon")
    
    __table_args__ = (
        Index('ix_marketing_campaigns_status', 'status'),
        Index('ix_marketing_campaigns_dates', 'start_date', 'end_date'),
    )


class ReferralProgram(Base):
    """Referral program configuration"""
    __tablename__ = "referral_programs"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # Program details
    name: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[Optional[str]] = Column(Text)
    is_active: Mapped[bool] = Column(Boolean, default=True)
    
    # Rewards
    referrer_reward_type: Mapped[str] = Column(String(20), nullable=False)  # percentage, fixed_amount, points
    referrer_reward_value: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    referee_reward_type: Mapped[str] = Column(String(20), nullable=False)
    referee_reward_value: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    # Constraints
    minimum_purchase: Mapped[Optional[float]] = Column(Numeric(10, 2))
    maximum_referrals_per_user: Mapped[Optional[int]] = Column(Integer)
    
    # Validity
    start_date: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ReferralCode(Base):
    """User referral codes"""
    __tablename__ = "referral_codes"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    program_id: Mapped[int] = Column(Integer, ForeignKey("referral_programs.id"), nullable=False, index=True)
    referrer_user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Code
    code: Mapped[str] = Column(String(50), unique=True, nullable=False, index=True)
    
    # Usage stats
    total_uses: Mapped[int] = Column(Integer, default=0)
    total_revenue: Mapped[float] = Column(Numeric(12, 2), default=0)
    total_rewards_earned: Mapped[float] = Column(Numeric(10, 2), default=0)
    
    # Status
    is_active: Mapped[bool] = Column(Boolean, default=True)
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    referrer: Mapped["User"] = relationship("User", foreign_keys=[referrer_user_id])
    program: Mapped["ReferralProgram"] = relationship("ReferralProgram")


class ReferralConversion(Base):
    """Referral conversion tracking"""
    __tablename__ = "referral_conversions"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    referral_code_id: Mapped[int] = Column(Integer, ForeignKey("referral_codes.id"), nullable=False, index=True)
    
    # Users
    referrer_user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    referee_user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Order
    order_id: Mapped[int] = Column(Integer, ForeignKey("orders.id"), nullable=False)
    order_value: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    # Rewards
    referrer_reward: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    referee_reward: Mapped[float] = Column(Numeric(10, 2), nullable=False)
    
    # Coupon codes generated
    referrer_coupon_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("coupons.id"))
    referee_coupon_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("coupons.id"))
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    referral_code: Mapped["ReferralCode"] = relationship("ReferralCode")
    referrer: Mapped["User"] = relationship("User", foreign_keys=[referrer_user_id])
    referee: Mapped["User"] = relationship("User", foreign_keys=[referee_user_id])
    order: Mapped["Order"] = relationship("Order")


class LoyaltyProgram(Base):
    """Loyalty points program"""
    __tablename__ = "loyalty_programs"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    
    # Program details
    name: Mapped[str] = Column(String(255), nullable=False)
    description: Mapped[Optional[str]] = Column(Text)
    is_active: Mapped[bool] = Column(Boolean, default=True)
    
    # Points earning
    points_per_euro: Mapped[float] = Column(Numeric(5, 2), default=1)  # Points per € spent
    signup_bonus: Mapped[int] = Column(Integer, default=0)
    birthday_bonus: Mapped[int] = Column(Integer, default=0)
    review_bonus: Mapped[int] = Column(Integer, default=0)
    
    # Points redemption
    points_value: Mapped[float] = Column(Numeric(5, 4), default=0.01)  # € value per point
    minimum_redemption_points: Mapped[int] = Column(Integer, default=100)
    
    # Tiers (optional)
    has_tiers: Mapped[bool] = Column(Boolean, default=False)
    tiers: Mapped[Optional[str]] = Column(JSON)  # [{name, min_points, multiplier, benefits}]
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LoyaltyAccount(Base):
    """User loyalty account"""
    __tablename__ = "loyalty_accounts"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    program_id: Mapped[int] = Column(Integer, ForeignKey("loyalty_programs.id"), nullable=False, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Points
    current_points: Mapped[int] = Column(Integer, default=0)
    lifetime_points: Mapped[int] = Column(Integer, default=0)
    points_redeemed: Mapped[int] = Column(Integer, default=0)
    
    # Tier
    current_tier: Mapped[Optional[str]] = Column(String(50))
    tier_expiry: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    program: Mapped["LoyaltyProgram"] = relationship("LoyaltyProgram")
    
    __table_args__ = (
        Index('ix_loyalty_accounts_user_program', 'user_id', 'program_id', unique=True),
    )


class LoyaltyTransaction(Base):
    """Loyalty points transaction history"""
    __tablename__ = "loyalty_transactions"
    
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    account_id: Mapped[int] = Column(Integer, ForeignKey("loyalty_accounts.id"), nullable=False, index=True)
    
    # Transaction
    transaction_type: Mapped[str] = Column(String(20), nullable=False)  # earn, redeem, expire, bonus, refund
    points: Mapped[int] = Column(Integer, nullable=False)  # Positive for earn, negative for redeem
    
    # Reference
    order_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("orders.id"))
    description: Mapped[str] = Column(String(255), nullable=False)
    
    # Expiry (for earned points)
    expires_at: Mapped[Optional[datetime]] = Column(DateTime(timezone=True))
    
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account: Mapped["LoyaltyAccount"] = relationship("LoyaltyAccount")
    
    __table_args__ = (
        Index('ix_loyalty_transactions_account_created', 'account_id', 'created_at'),
    )
