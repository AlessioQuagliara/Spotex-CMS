"""
Email utility functions
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import aiofiles
import jinja2
from pathlib import Path

from app.core.config import settings
from app.core.security import create_access_token
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Email templates
TEMPLATE_DIR = Path(__file__).parent / "templates"

async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
):
    """Send email using SMTP"""
    if not settings.EMAIL_ENABLED:
        logger.info(f"Email disabled, would send to {to_email}: {subject}")
        return
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to_email
        
        # Add text version
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
        
        # Add HTML version
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        if settings.SMTP_TLS:
            server.starttls()
        
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        
        server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        raise

async def send_verification_email(email: str, user_id: int):
    """Send email verification link"""
    token = create_access_token(
        {"sub": str(user_id), "type": "email_verification"},
        timedelta(hours=24)
    )
    
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    subject = f"Verify your email - {settings.APP_NAME}"
    html_content = f"""
    <html>
    <body>
        <h2>Welcome to {settings.APP_NAME}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{verification_url}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
    </body>
    </html>
    """
    
    await send_email(email, subject, html_content)

async def send_magic_link_email(email: str, token: str):
    """Send magic link for passwordless login"""
    login_url = f"{settings.FRONTEND_URL}/auth/magic-link?token={token}"
    
    subject = f"Sign in to {settings.APP_NAME}"
    html_content = f"""
    <html>
    <body>
        <h2>Sign in to {settings.APP_NAME}</h2>
        <p>Click the link below to sign in:</p>
        <a href="{login_url}">Sign In</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
    </body>
    </html>
    """
    
    await send_email(email, subject, html_content)

async def send_password_reset_email(email: str, token: str):
    """Send password reset email"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    subject = f"Reset your password - {settings.APP_NAME}"
    html_content = f"""
    <html>
    <body>
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="{reset_url}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
    </body>
    </html>
    """
    
    await send_email(email, subject, html_content)

async def send_2fa_code_email(email: str, code: str):
    """Send 2FA code via email"""
    subject = f"Your verification code - {settings.APP_NAME}"
    html_content = f"""
    <html>
    <body>
        <h2>Your verification code</h2>
        <p>Your verification code is: <strong>{code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
    </body>
    </html>
    """
    
    await send_email(email, subject, html_content)

# Import missing
from datetime import timedelta