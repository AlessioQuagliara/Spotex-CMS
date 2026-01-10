"""
Marketing schemas
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from decimal import Decimal


# Marketing Campaigns
class CampaignCreate(BaseModel):
    """Create marketing campaign"""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    campaign_type: str = Field(..., regex="^(email|social|referral|seasonal)$")
    target_segment: Optional[str] = None
    target_customers: Optional[List[int]] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    budget: Optional[Decimal] = None
    revenue_goal: Optional[Decimal] = None
    orders_goal: Optional[int] = None
    coupon_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

    class Config:
        from_attributes = True


class CampaignUpdate(BaseModel):
    """Update campaign"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, regex="^(draft|active|paused|completed)$")
    end_date: Optional[datetime] = None
    budget: Optional[Decimal] = None
    revenue_goal: Optional[Decimal] = None

    class Config:
        from_attributes = True


class CampaignResponse(BaseModel):
    """Campaign response"""
    id: int
    store_id: int
    name: str
    description: Optional[str]
    campaign_type: str
    status: str
    target_segment: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    budget: Optional[Decimal]
    revenue_goal: Optional[Decimal]
    orders_goal: Optional[int]
    total_sent: int
    total_opened: int
    total_clicked: int
    total_conversions: int
    total_revenue: Decimal
    coupon_id: Optional[int]
    created_at: datetime

    # Calculated metrics
    open_rate: Optional[float] = None
    click_rate: Optional[float] = None
    conversion_rate: Optional[float] = None
    roi: Optional[float] = None

    class Config:
        from_attributes = True


# Referral Program
class ReferralProgramCreate(BaseModel):
    """Create referral program"""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    referrer_reward_type: str = Field(..., regex="^(percentage|fixed_amount|points)$")
    referrer_reward_value: Decimal = Field(..., gt=0)
    referee_reward_type: str = Field(..., regex="^(percentage|fixed_amount|points)$")
    referee_reward_value: Decimal = Field(..., gt=0)
    minimum_purchase: Optional[Decimal] = Field(None, ge=0)
    maximum_referrals_per_user: Optional[int] = Field(None, gt=0)
    start_date: datetime
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReferralProgramResponse(BaseModel):
    """Referral program response"""
    id: int
    store_id: int
    name: str
    description: Optional[str]
    is_active: bool
    referrer_reward_type: str
    referrer_reward_value: Decimal
    referee_reward_type: str
    referee_reward_value: Decimal
    minimum_purchase: Optional[Decimal]
    maximum_referrals_per_user: Optional[int]
    start_date: datetime
    end_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ReferralCodeResponse(BaseModel):
    """Referral code response"""
    id: int
    code: str
    total_uses: int
    total_revenue: Decimal
    total_rewards_earned: Decimal
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReferralStatsResponse(BaseModel):
    """Referral statistics"""
    total_referrals: int
    successful_conversions: int
    total_revenue: Decimal
    total_rewards_given: Decimal
    conversion_rate: float
    top_referrers: List[Dict[str, Any]]

    class Config:
        from_attributes = True


# Loyalty Program
class LoyaltyProgramCreate(BaseModel):
    """Create loyalty program"""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    points_per_euro: Decimal = Field(default=1, gt=0)
    signup_bonus: int = Field(default=0, ge=0)
    birthday_bonus: int = Field(default=0, ge=0)
    review_bonus: int = Field(default=0, ge=0)
    points_value: Decimal = Field(default=0.01, gt=0)  # € per point
    minimum_redemption_points: int = Field(default=100, gt=0)
    has_tiers: bool = False
    tiers: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True


class LoyaltyProgramResponse(BaseModel):
    """Loyalty program response"""
    id: int
    store_id: int
    name: str
    description: Optional[str]
    is_active: bool
    points_per_euro: Decimal
    signup_bonus: int
    birthday_bonus: int
    review_bonus: int
    points_value: Decimal
    minimum_redemption_points: int
    has_tiers: bool
    tiers: Optional[List[Dict[str, Any]]]
    created_at: datetime

    class Config:
        from_attributes = True


class LoyaltyAccountResponse(BaseModel):
    """Loyalty account response"""
    id: int
    user_id: int
    current_points: int
    lifetime_points: int
    points_redeemed: int
    current_tier: Optional[str]
    tier_expiry: Optional[datetime]
    points_value_euro: Decimal  # Current points value in €

    class Config:
        from_attributes = True


class RedeemPointsRequest(BaseModel):
    """Redeem points request"""
    points: int = Field(..., gt=0)

    class Config:
        from_attributes = True


class LoyaltyTransactionResponse(BaseModel):
    """Loyalty transaction response"""
    id: int
    transaction_type: str
    points: int
    description: str
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Bulk Coupon Generation
class BulkCouponRequest(BaseModel):
    """Bulk coupon generation request"""
    prefix: str = Field(..., max_length=10)
    quantity: int = Field(..., gt=0, le=10000)
    discount_type: str
    discount_value: Decimal
    valid_from: datetime
    valid_until: Optional[datetime] = None
    max_uses_per_user: int = 1
    minimum_purchase: Optional[Decimal] = None

    class Config:
        from_attributes = True


class BulkCouponResponse(BaseModel):
    """Bulk coupon response"""
    codes: List[str]
    total_created: int
    campaign_id: Optional[int] = None

    class Config:
        from_attributes = True


class CouponAnalyticsResponse(BaseModel):
    """Coupon analytics"""
    coupon_code: str
    total_uses: int
    unique_users: int
    total_discount_given: Decimal
    total_revenue: Decimal
    average_order_value: Decimal
    conversion_rate: float

    class Config:
        from_attributes = True
