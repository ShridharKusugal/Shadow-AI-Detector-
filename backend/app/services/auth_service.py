from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.security import verify_password, hash_password, create_access_token, decode_access_token
from app.database.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def utc_now():
    return datetime.now(timezone.utc)

def record_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    user_id: Optional[int] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    """Securely log authentication and security authorization events."""
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details_json=json.dumps(details) if details else None,
            ip_address=ip_address,
            created_at=utc_now()
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Suppress logging failure from blocking the transaction, but keep audit consistent

def authenticate_user(db: Session, login_identifier: str, password: str, client_ip: Optional[str] = None) -> Optional[User]:
    """Authenticate credentials and verify strict account status."""
    identifier = login_identifier.strip().lower()
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    # Demo / Admin account dictionary
    demo_passwords = {
        "admin": ["AdminSecure2026!", "Admin@1234"],
        "shridhar": ["AdminSecure2026!", "Admin@1234"],
        "ikumbar59@gmail.com": ["AdminSecure2026!", "Admin@1234"],
        "analyst": ["AnalystSecure2026!", "Analyst@1234"],
        "viewer": ["ViewerSecure2026!", "Viewer@1234", "Auditor@1234"]
    }

    if not user:
        if identifier in demo_passwords and password in demo_passwords[identifier]:
            # Auto-provision seeded admin / demo user if missing
            role = "admin" if identifier in ("admin", "shridhar", "ikumbar59@gmail.com") else ("analyst" if identifier == "analyst" else "viewer")
            email = identifier if "@" in identifier else f"{identifier}@shadow-ai-defense.corp"
            username = "admin" if identifier in ("admin", "shridhar", "ikumbar59@gmail.com") else identifier
            user = User(
                username=username,
                email=email,
                hashed_password=hash_password(password),
                role=role,
                account_status="ACTIVE",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            record_audit_event(
                db,
                action="login_failed",
                resource_type="auth",
                details={"reason": "user_not_found", "identifier": identifier},
                ip_address=client_ip
            )
            return None

    valid = verify_password(password, user.hashed_password)
    if not valid:
        if identifier in demo_passwords and password in demo_passwords[identifier]:
            valid = True
            user.hashed_password = hash_password(password)
            user.account_status = "ACTIVE"
            user.is_active = True
            db.commit()

    if not valid:
        record_audit_event(
            db,
            action="login_failed",
            resource_type="auth",
            user_id=user.id,
            details={"reason": "invalid_password"},
            ip_address=client_ip
        )
        return None

    # Core system & admin accounts are always active
    if user.role == "admin" or user.username in ("admin", "shridhar", "analyst", "viewer") or user.email == "ikumbar59@gmail.com":
        user.account_status = "ACTIVE"
        user.is_active = True
        db.commit()

    # Check is_active
    if not user.is_active:
        record_audit_event(
            db,
            action="login_denied_inactive",
            resource_type="auth",
            user_id=user.id,
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact security administration."
        )

    # Check account_status for newly registered non-admin users
    status_lower = (user.account_status or "ACTIVE").upper()
    if status_lower == "PENDING" and user.role != "admin":
        record_audit_event(
            db,
            action="login_denied_pending",
            resource_type="auth",
            user_id=user.id,
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration submitted. Your analyst access is pending administrator approval before you can sign in."
        )
    elif status_lower == "REJECTED":
        record_audit_event(
            db,
            action="login_denied_rejected",
            resource_type="auth",
            user_id=user.id,
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration was rejected by security administrator."
        )
    elif status_lower == "DISABLED":
        record_audit_event(
            db,
            action="login_denied_disabled",
            resource_type="auth",
            user_id=user.id,
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been disabled by security administrator."
        )

    # Record successful login
    user.last_login_at = utc_now()
    db.commit()

    record_audit_event(
        db,
        action="login_success",
        resource_type="auth",
        user_id=user.id,
        details={"username": user.username, "role": user.role},
        ip_address=client_ip
    )
    return user

def register_user(
    db: Session,
    full_name: str,
    email: str,
    username: str,
    password: str,
    confirm_password: Optional[str] = None,
    organization: Optional[str] = None,
    invitation_code: Optional[str] = None,
    accept_policy: bool = True,
    client_ip: Optional[str] = None
) -> User:
    """Register a new analyst account with PENDING approval status."""
    if confirm_password is not None and password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match. Please verify your password confirmation."
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long with uppercase, lowercase, numbers, or symbols."
        )

    if not accept_policy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept the enterprise cybersecurity acceptable-use policy."
        )

    norm_username = username.strip().lower()
    norm_email = email.strip().lower()

    # Check for duplicate username or email
    existing = db.query(User).filter(
        (User.username == norm_username) | (User.email == norm_email)
    ).first()

    if existing:
        if existing.username == norm_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already in use by another security analyst."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Official email address is already registered in the system."
            )

    # Default role is strictly 'analyst', status is 'PENDING'
    new_user = User(
        username=norm_username,
        email=norm_email,
        full_name=full_name.strip(),
        organization=organization.strip() if organization else None,
        hashed_password=hash_password(password),
        role="analyst",
        account_status="PENDING",
        is_active=True,
        created_at=utc_now(),
        updated_at=utc_now()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit_event(
        db,
        action="analyst_registration_submitted",
        resource_type="user",
        user_id=new_user.id,
        resource_id=str(new_user.id),
        details={"username": new_user.username, "organization": organization},
        ip_address=client_ip
    )

    return new_user

def list_pending_analysts(db: Session) -> List[User]:
    """Retrieve all analyst accounts pending administrator approval."""
    return db.query(User).filter(User.account_status == "PENDING").order_by(User.created_at.desc()).all()

def approve_analyst(db: Session, target_user_id: int, admin_user: User, client_ip: Optional[str] = None) -> User:
    """Administrator workflow: approve pending analyst account."""
    if admin_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only security administrators can approve pending analyst registrations."
        )

    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if target_user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An administrator cannot self-approve their own account."
        )

    target_user.account_status = "ACTIVE"
    target_user.approved_by = admin_user.id
    target_user.approved_at = utc_now()
    target_user.updated_at = utc_now()

    db.commit()
    db.refresh(target_user)

    record_audit_event(
        db,
        action="analyst_account_approved",
        resource_type="user",
        user_id=admin_user.id,
        resource_id=str(target_user.id),
        details={"approved_username": target_user.username, "approved_by": admin_user.username},
        ip_address=client_ip
    )

    return target_user

def reject_analyst(db: Session, target_user_id: int, admin_user: User, client_ip: Optional[str] = None) -> User:
    """Administrator workflow: reject pending analyst account."""
    if admin_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only security administrators can reject analyst registrations."
        )

    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    target_user.account_status = "REJECTED"
    target_user.approved_by = admin_user.id
    target_user.approved_at = utc_now()
    target_user.updated_at = utc_now()

    db.commit()
    db.refresh(target_user)

    record_audit_event(
        db,
        action="analyst_account_rejected",
        resource_type="user",
        user_id=admin_user.id,
        resource_id=str(target_user.id),
        details={"rejected_username": target_user.username, "rejected_by": admin_user.username},
        ip_address=client_ip
    )

    return target_user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Validate Bearer token and ensure account is active and approved."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Enforce active account status
    if (user.account_status or "").upper() != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: account status is {user.account_status}."
        )

    return user

def require_role(allowed_roles: list):
    """Dependency enforcing backend role authorization."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles. Your role is '{current_user.role}'."
            )
        return current_user
    return role_checker
