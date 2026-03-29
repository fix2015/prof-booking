from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.modules.users.models import User, RefreshToken
from app.modules.users.services import get_user_by_email, get_user_by_phone, verify_password
import secrets


def create_access_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(db: Session, user: User) -> str:
    token_str = secrets.token_urlsafe(64)
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(user_id=user.id, token=token_str, expires_at=expire)
    db.add(rt)
    db.commit()
    return token_str


def authenticate_user(db: Session, password: str, email: str | None = None, phone: str | None = None) -> User:
    user = None
    if email:
        user = get_user_by_email(db, email)
    elif phone:
        user = get_user_by_phone(db, phone)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    return user


def refresh_access_token(db: Session, refresh_token_str: str) -> tuple[str, str]:
    rt = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == refresh_token_str,
            RefreshToken.revoked == False,  # noqa: E712
            RefreshToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if not rt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    # Rotate token
    rt.revoked = True
    db.commit()

    user = rt.user
    new_access = create_access_token(user)
    new_refresh = create_refresh_token(db, user)
    return new_access, new_refresh


def revoke_all_tokens(db: Session, user_id: int) -> None:
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id, RefreshToken.revoked == False  # noqa: E712
    ).update({"revoked": True})
    db.commit()
