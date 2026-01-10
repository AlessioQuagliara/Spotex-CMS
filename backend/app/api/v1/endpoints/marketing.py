"""
Marketing endpoints - campaigns, referrals, loyalty
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.marketing import *
from app.models.coupon import Coupon, CouponUsage, DiscountType
from app.schemas.marketing import *
from app.utils.marketing_service import CouponGeneratorService, ReferralService, LoyaltyService

router = APIRouter()


# Marketing Campaigns
@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    store_id: int,
    campaign: CampaignCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create marketing campaign"""
    db_campaign = MarketingCampaign(
        store_id=store_id,
        **campaign.model_dump()
    )
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    
    return db_campaign


@router.get("/campaigns", response_model=List[CampaignResponse])
async def list_campaigns(
    store_id: int,
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List marketing campaigns"""
    filters = [MarketingCampaign.store_id == store_id]
    
    if status:
        filters.append(MarketingCampaign.status == status)
    
    result = await db.execute(
        select(MarketingCampaign)
        .where(and_(*filters))
        .order_by(desc(MarketingCampaign.created_at))
    )
    campaigns = result.scalars().all()
    
    # Calculate metrics
    response = []
    for camp in campaigns:
        camp_dict = CampaignResponse.model_validate(camp).model_dump()
        
        # Calculate rates
        if camp.total_sent > 0:
            camp_dict['open_rate'] = round(camp.total_opened / camp.total_sent * 100, 2)
            camp_dict['click_rate'] = round(camp.total_clicked / camp.total_sent * 100, 2)
            camp_dict['conversion_rate'] = round(camp.total_conversions / camp.total_sent * 100, 2)
        
        # Calculate ROI
        if camp.budget and camp.budget > 0:
            roi = ((float(camp.total_revenue) - float(camp.budget)) / float(camp.budget)) * 100
            camp_dict['roi'] = round(roi, 2)
        
        response.append(CampaignResponse(**camp_dict))
    
    return response


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: int,
    campaign_update: CampaignUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update campaign"""
    result = await db.execute(
        select(MarketingCampaign).where(MarketingCampaign.id == campaign_id)
    )
    campaign = result.scalar_one_or_none()
    
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    for field, value in campaign_update.model_dump(exclude_unset=True).items():
        setattr(campaign, field, value)
    
    await db.commit()
    await db.refresh(campaign)
    
    return campaign


# Bulk Coupon Generation
@router.post("/coupons/bulk", response_model=BulkCouponResponse)
async def generate_bulk_coupons(
    store_id: int,
    request: BulkCouponRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate multiple coupon codes"""
    codes = await CouponGeneratorService.generate_bulk_coupons(
        db=db,
        store_id=store_id,
        prefix=request.prefix,
        quantity=request.quantity,
        discount_type=DiscountType(request.discount_type),
        discount_value=request.discount_value,
        valid_from=request.valid_from,
        valid_until=request.valid_until,
        max_uses_per_user=request.max_uses_per_user,
        minimum_purchase=request.minimum_purchase
    )
    
    return BulkCouponResponse(
        codes=codes,
        total_created=len(codes)
    )


@router.get("/coupons/{code}/analytics", response_model=CouponAnalyticsResponse)
async def get_coupon_analytics(
    code: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get coupon usage analytics"""
    # Get coupon
    result = await db.execute(
        select(Coupon).where(Coupon.code == code)
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    
    # Get usage stats
    usage_result = await db.execute(
        select(
            func.count(CouponUsage.id).label('total_uses'),
            func.count(func.distinct(CouponUsage.user_id)).label('unique_users')
        )
        .where(CouponUsage.coupon_id == coupon.id)
    )
    usage_stats = usage_result.first()
    
    # Get order stats
    from app.models.order import Order, PaymentStatus
    order_result = await db.execute(
        select(
            func.sum(Order.discount_amount).label('total_discount'),
            func.sum(Order.total_amount).label('total_revenue'),
            func.avg(Order.total_amount).label('avg_order')
        )
        .where(
            Order.coupon_code == code,
            Order.payment_status == PaymentStatus.COMPLETED
        )
    )
    order_stats = order_result.first()
    
    # Calculate conversion rate
    conversion_rate = 0.0
    if usage_stats.total_uses > 0:
        conversion_rate = (usage_stats.total_uses / usage_stats.total_uses * 100)
    
    return CouponAnalyticsResponse(
        coupon_code=code,
        total_uses=usage_stats.total_uses,
        unique_users=usage_stats.unique_users,
        total_discount_given=Decimal(str(order_stats.total_discount or 0)),
        total_revenue=Decimal(str(order_stats.total_revenue or 0)),
        average_order_value=Decimal(str(order_stats.avg_order or 0)),
        conversion_rate=round(conversion_rate, 2)
    )


# Referral Program
@router.post("/referral-programs", response_model=ReferralProgramResponse)
async def create_referral_program(
    store_id: int,
    program: ReferralProgramCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create referral program"""
    db_program = ReferralProgram(
        store_id=store_id,
        **program.model_dump()
    )
    db.add(db_program)
    await db.commit()
    await db.refresh(db_program)
    
    return db_program


@router.get("/referral-programs/active", response_model=Optional[ReferralProgramResponse])
async def get_active_referral_program(
    store_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get active referral program"""
    result = await db.execute(
        select(ReferralProgram)
        .where(
            ReferralProgram.store_id == store_id,
            ReferralProgram.is_active == True
        )
        .order_by(desc(ReferralProgram.created_at))
        .limit(1)
    )
    program = result.scalar_one_or_none()
    
    return program


@router.get("/referral-codes/my-code", response_model=ReferralCodeResponse)
async def get_my_referral_code(
    store_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's referral code (creates if not exists)"""
    # Get active program
    program_result = await db.execute(
        select(ReferralProgram)
        .where(
            ReferralProgram.store_id == store_id,
            ReferralProgram.is_active == True
        )
        .limit(1)
    )
    program = program_result.scalar_one_or_none()
    
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active referral program"
        )
    
    # Get or create code
    code = await ReferralService.create_referral_code(
        db=db,
        program_id=program.id,
        user_id=current_user.id
    )
    
    # Get full referral code object
    result = await db.execute(
        select(ReferralCode).where(ReferralCode.code == code)
    )
    referral_code = result.scalar_one()
    
    return referral_code


@router.get("/referral-programs/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(
    store_id: int,
    program_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get referral program statistics"""
    filters = []
    
    if program_id:
        filters.append(ReferralCode.program_id == program_id)
    
    # Total referrals
    total_result = await db.execute(
        select(func.count(ReferralCode.id))
        .where(and_(*filters)) if filters else select(func.count(ReferralCode.id))
    )
    total_referrals = total_result.scalar() or 0
    
    # Conversions
    conversion_result = await db.execute(
        select(
            func.count(ReferralConversion.id).label('conversions'),
            func.sum(ReferralConversion.order_value).label('revenue'),
            func.sum(ReferralConversion.referrer_reward + ReferralConversion.referee_reward).label('rewards')
        )
        .join(ReferralCode, ReferralCode.id == ReferralConversion.referral_code_id)
        .where(and_(*filters)) if filters else select(
            func.count(ReferralConversion.id),
            func.sum(ReferralConversion.order_value),
            func.sum(ReferralConversion.referrer_reward + ReferralConversion.referee_reward)
        )
    )
    conversion_stats = conversion_result.first()
    
    # Top referrers
    top_result = await db.execute(
        select(
            User.email,
            ReferralCode.code,
            ReferralCode.total_uses,
            ReferralCode.total_revenue
        )
        .join(User, User.id == ReferralCode.referrer_user_id)
        .where(and_(*filters)) if filters else select(
            User.email,
            ReferralCode.code,
            ReferralCode.total_uses,
            ReferralCode.total_revenue
        ).join(User, User.id == ReferralCode.referrer_user_id)
        .order_by(desc(ReferralCode.total_revenue))
        .limit(10)
    )
    
    top_referrers = [
        {
            'email': row.email,
            'code': row.code,
            'total_referrals': row.total_uses,
            'total_revenue': float(row.total_revenue)
        }
        for row in top_result.fetchall()
    ]
    
    conversion_rate = 0.0
    if total_referrals > 0:
        conversion_rate = (conversion_stats.conversions / total_referrals * 100)
    
    return ReferralStatsResponse(
        total_referrals=total_referrals,
        successful_conversions=conversion_stats.conversions or 0,
        total_revenue=Decimal(str(conversion_stats.revenue or 0)),
        total_rewards_given=Decimal(str(conversion_stats.rewards or 0)),
        conversion_rate=round(conversion_rate, 2),
        top_referrers=top_referrers
    )


# Loyalty Program
@router.post("/loyalty-programs", response_model=LoyaltyProgramResponse)
async def create_loyalty_program(
    store_id: int,
    program: LoyaltyProgramCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create loyalty program"""
    db_program = LoyaltyProgram(
        store_id=store_id,
        **program.model_dump()
    )
    db.add(db_program)
    await db.commit()
    await db.refresh(db_program)
    
    return db_program


@router.get("/loyalty-programs/active", response_model=Optional[LoyaltyProgramResponse])
async def get_active_loyalty_program(
    store_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get active loyalty program"""
    result = await db.execute(
        select(LoyaltyProgram)
        .where(
            LoyaltyProgram.store_id == store_id,
            LoyaltyProgram.is_active == True
        )
        .order_by(desc(LoyaltyProgram.created_at))
        .limit(1)
    )
    program = result.scalar_one_or_none()
    
    return program


@router.get("/loyalty-accounts/my-account", response_model=LoyaltyAccountResponse)
async def get_my_loyalty_account(
    store_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's loyalty account"""
    # Get active program
    program_result = await db.execute(
        select(LoyaltyProgram)
        .where(
            LoyaltyProgram.store_id == store_id,
            LoyaltyProgram.is_active == True
        )
        .limit(1)
    )
    program = program_result.scalar_one_or_none()
    
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active loyalty program"
        )
    
    # Get or create account
    account = await LoyaltyService.get_or_create_account(
        db=db,
        program_id=program.id,
        user_id=current_user.id
    )
    
    # Calculate points value
    points_value = Decimal(str(account.current_points)) * program.points_value
    
    return LoyaltyAccountResponse(
        id=account.id,
        user_id=account.user_id,
        current_points=account.current_points,
        lifetime_points=account.lifetime_points,
        points_redeemed=account.points_redeemed,
        current_tier=account.current_tier,
        tier_expiry=account.tier_expiry,
        points_value_euro=points_value
    )


@router.post("/loyalty-accounts/redeem", response_model=dict)
async def redeem_loyalty_points(
    store_id: int,
    request: RedeemPointsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Redeem loyalty points for coupon"""
    # Get program
    program_result = await db.execute(
        select(LoyaltyProgram)
        .where(
            LoyaltyProgram.store_id == store_id,
            LoyaltyProgram.is_active == True
        )
        .limit(1)
    )
    program = program_result.scalar_one_or_none()
    
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active loyalty program"
        )
    
    # Get account
    account_result = await db.execute(
        select(LoyaltyAccount)
        .where(
            LoyaltyAccount.program_id == program.id,
            LoyaltyAccount.user_id == current_user.id
        )
    )
    account = account_result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loyalty account not found"
        )
    
    try:
        coupon = await LoyaltyService.redeem_points(
            db=db,
            account_id=account.id,
            points=request.points
        )
        
        value = Decimal(str(request.points)) * program.points_value
        
        return {
            "message": "Points redeemed successfully",
            "coupon_code": coupon.code,
            "coupon_value": float(value),
            "points_redeemed": request.points,
            "remaining_points": account.current_points
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/loyalty-accounts/transactions", response_model=List[LoyaltyTransactionResponse])
async def get_loyalty_transactions(
    store_id: int,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get loyalty transaction history"""
    # Get program and account
    program_result = await db.execute(
        select(LoyaltyProgram)
        .where(
            LoyaltyProgram.store_id == store_id,
            LoyaltyProgram.is_active == True
        )
        .limit(1)
    )
    program = program_result.scalar_one_or_none()
    
    if not program:
        return []
    
    account_result = await db.execute(
        select(LoyaltyAccount)
        .where(
            LoyaltyAccount.program_id == program.id,
            LoyaltyAccount.user_id == current_user.id
        )
    )
    account = account_result.scalar_one_or_none()
    
    if not account:
        return []
    
    # Get transactions
    result = await db.execute(
        select(LoyaltyTransaction)
        .where(LoyaltyTransaction.account_id == account.id)
        .order_by(desc(LoyaltyTransaction.created_at))
        .limit(limit)
    )
    transactions = result.scalars().all()
    
    return transactions
