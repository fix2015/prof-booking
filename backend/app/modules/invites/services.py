import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.modules.invites.models import Invite, InviteStatus
from app.modules.invites.schemas import InviteCreate
from app.modules.users.models import User


def create_invite(
    db: Session, provider_id: int, data: InviteCreate, created_by: User
) -> Invite:
    # Check for existing pending invite
    existing = (
        db.query(Invite)
        .filter(
            Invite.provider_id == provider_id,
            Invite.invited_email == data.invited_email.lower(),
            Invite.status == InviteStatus.PENDING,
        )
        .first()
    )
    if existing and existing.expires_at > datetime.utcnow():
        return existing  # Return existing valid invite

    token = secrets.token_urlsafe(48)
    invite = Invite(
        provider_id=provider_id,
        invited_email=data.invited_email.lower(),
        token=token,
        created_by_user_id=created_by.id,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Queue invite email
    try:
        _send_invite_email(invite)
    except Exception:
        pass

    return invite


def validate_invite_token(db: Session, token: str) -> Invite:
    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite token")
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Invite is {invite.status.value}")
    if invite.expires_at < datetime.utcnow():
        invite.status = InviteStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=400, detail="Invite has expired")
    return invite


def consume_invite(db: Session, token: str, user: User) -> int:
    """Called during professional registration to link them to a provider."""
    invite = validate_invite_token(db, token)
    invite.status = InviteStatus.ACCEPTED
    invite.accepted_by_user_id = user.id
    invite.accepted_at = datetime.utcnow()
    db.commit()
    return invite.provider_id


def list_provider_invites(db: Session, provider_id: int):
    return (
        db.query(Invite)
        .filter(Invite.provider_id == provider_id)
        .order_by(Invite.created_at.desc())
        .all()
    )


# Backward-compat alias
list_salon_invites = list_provider_invites


def revoke_invite(db: Session, invite_id: int, provider_id: int) -> Invite:
    invite = db.query(Invite).filter(Invite.id == invite_id, Invite.provider_id == provider_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.status = InviteStatus.REVOKED
    db.commit()
    db.refresh(invite)
    return invite


def _send_invite_email(invite: Invite) -> None:
    from app.config import settings
    import smtplib
    from email.mime.text import MIMEText
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        return

    body = f"""
    <h2>You've been invited!</h2>
    <p>You have been invited to join a service provider as a professional.</p>
    <p>Use this link to register:</p>
    <a href="{settings.APP_ALLOWED_ORIGINS.split(',')[0]}/register/professional?invite={invite.token}">
        Accept Invitation
    </a>
    <p>This invitation expires in 7 days.</p>
    """
    msg = MIMEText(body, "html")
    msg["Subject"] = "You've been invited to the Global Service Marketplace"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = invite.invited_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(settings.EMAIL_FROM, invite.invited_email, msg.as_string())
    except Exception:
        pass
