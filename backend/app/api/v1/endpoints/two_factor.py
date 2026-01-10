"""
Two-factor authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_verified_user
from app.core.security import (
    generate_totp_secret, get_totp_uri, generate_qr_code,
    verify_totp_code, generate_backup_codes, encrypt_sensitive_data
)
from app.models.user import User, TwoFactorMethod
from app.schemas.auth import *

router = APIRouter()

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    setup_data: TwoFactorSetupRequest,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Setup two-factor authentication"""
    if current_user.two_factor_method != TwoFactorMethod.NONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA already enabled"
        )
    
    if setup_data.method == "totp":
        # Generate TOTP secret
        secret = generate_totp_secret()
        uri = get_totp_uri(secret, current_user.email)
        qr_code = generate_qr_code(uri)
        
        # Store temporary secret (encrypt it)
        current_user.two_factor_secret = encrypt_sensitive_data(secret)
        
        await db.commit()
        
        return TwoFactorSetupResponse(
            method="totp",
            secret=secret,
            qr_code=qr_code,
            backup_codes=[]
        )
    
    elif setup_data.method in ["sms", "email"]:
        # For SMS/Email, generate backup codes
        backup_codes = generate_backup_codes()
        current_user.two_factor_backup_codes = encrypt_sensitive_data(",".join(backup_codes))
        
        await db.commit()
        
        return TwoFactorSetupResponse(
            method=setup_data.method,
            secret="",
            qr_code="",
            backup_codes=backup_codes
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA method"
        )

@router.post("/2fa/enable")
async def enable_2fa(
    enable_data: TwoFactorEnableRequest,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Enable two-factor authentication"""
    if current_user.two_factor_method != TwoFactorMethod.NONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA already enabled"
        )
    
    if current_user.two_factor_secret:
        # Verify TOTP code before enabling
        from app.core.security import decrypt_sensitive_data
        secret = decrypt_sensitive_data(current_user.two_factor_secret)
        
        if not verify_totp_code(secret, enable_data.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )
        
        current_user.two_factor_method = TwoFactorMethod.TOTP
        current_user.two_factor_secret = encrypt_sensitive_data(secret)  # Keep encrypted
    
    elif current_user.two_factor_backup_codes:
        current_user.two_factor_method = TwoFactorMethod(enable_data.method)
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not properly set up"
        )
    
    await db.commit()
    
    return {"message": "2FA enabled successfully"}

@router.post("/2fa/disable")
async def disable_2fa(
    disable_data: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Disable two-factor authentication"""
    if current_user.two_factor_method == TwoFactorMethod.NONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not enabled"
        )
    
    # Verify current password
    from app.core.security import verify_password
    if not verify_password(disable_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password"
        )
    
    current_user.two_factor_method = TwoFactorMethod.NONE
    current_user.two_factor_secret = None
    current_user.two_factor_backup_codes = None
    
    await db.commit()
    
    return {"message": "2FA disabled successfully"}

@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
async def get_2fa_status(
    current_user: User = Depends(get_current_verified_user)
):
    """Get 2FA status"""
    return TwoFactorStatusResponse(
        enabled=current_user.two_factor_method != TwoFactorMethod.NONE,
        method=current_user.two_factor_method.value,
        has_backup_codes=bool(current_user.two_factor_backup_codes)
    )

@router.post("/2fa/backup-codes/regenerate")
async def regenerate_backup_codes(
    current_user: User = Depends(get_current_verified_user),
    db: AsyncSession = Depends(get_db)
):
    """Regenerate backup codes"""
    if current_user.two_factor_method == TwoFactorMethod.NONE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not enabled"
        )
    
    backup_codes = generate_backup_codes()
    current_user.two_factor_backup_codes = encrypt_sensitive_data(",".join(backup_codes))
    
    await db.commit()
    
    return {"backup_codes": backup_codes}