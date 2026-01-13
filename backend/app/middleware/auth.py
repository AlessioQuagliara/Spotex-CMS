from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.repositories.user import UserRepository

security = HTTPBearer()
user_repo = UserRepository()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    # TODO: Implement JWT token validation
    # Per ora, semplice controllo con API key
    token = credentials.credentials
    
    # Placeholder - implementa la logica JWT
    user = user_repo.get(db, 1)  # Placeholder
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(required_role: str):
    async def role_checker(user = Depends(get_current_user)):
        if user.role.value != required_role and user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return role_checker


def require_admin():
    """Dependency shortcut to restrict access to admin users."""
    return require_role("admin")