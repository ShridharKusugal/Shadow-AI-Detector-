from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.auth_service import (
    authenticate_user, register_user, get_current_user, require_role,
    list_pending_analysts, approve_analyst, reject_analyst, record_audit_event
)
from app.core.security import create_access_token
from app.schemas.common import (
    TokenResponse, UserLoginRequest, UserRegisterRequest,
    UserRegisterResponse, UserProfileResponse, PendingAnalystItem,
    UserApprovalActionResponse
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_client_ip(request: Request) -> str:
    client_host = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_host = forwarded.split(",")[0].strip()
    return client_host

@router.post("/login", response_model=TokenResponse)
def login(login_req: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate user credentials and enforce verified active account status."""
    ip = get_client_ip(request)
    user = authenticate_user(db, login_req.username, login_req.password, client_ip=ip)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.username, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        role=user.role,
        account_status=user.account_status,
        full_name=user.full_name
    )

@router.post("/register", response_model=UserRegisterResponse)
def register(reg_req: UserRegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new analyst account with PENDING administrator approval."""
    ip = get_client_ip(request)
    user = register_user(
        db,
        full_name=reg_req.full_name,
        email=reg_req.email,
        username=reg_req.username,
        password=reg_req.password,
        confirm_password=reg_req.confirm_password,
        organization=reg_req.organization,
        invitation_code=reg_req.invitation_code,
        accept_policy=reg_req.accept_policy,
        client_ip=ip
    )
    return UserRegisterResponse(
        status="pending_approval",
        message="Registration submitted. Your analyst access is pending administrator approval before you can sign in.",
        user_id=user.id,
        username=user.username,
        email=user.email,
        account_status=user.account_status
    )

@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Explicitly record analyst logout and security session termination."""
    ip = get_client_ip(request)
    record_audit_event(
        db,
        action="logout",
        resource_type="auth",
        user_id=current_user.id,
        details={"username": current_user.username},
        ip_address=ip
    )
    return {"success": True, "message": "Successfully logged out. Session terminated."}

@router.get("/me", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Return verified current authenticated user profile."""
    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        organization=current_user.organization,
        role=current_user.role,
        account_status=current_user.account_status,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        approved_at=current_user.approved_at
    )

# --- Administrative Approval Workflows ---

@router.get("/admin/pending-analysts", response_model=List[PendingAnalystItem])
def get_pending_analysts(
    current_admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Administrator-only: list all analyst registrations pending review."""
    pending = list_pending_analysts(db)
    return [
        PendingAnalystItem(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            organization=u.organization,
            role=u.role,
            account_status=u.account_status,
            created_at=u.created_at
        )
        for u in pending
    ]

@router.post("/admin/approve-analyst/{user_id}", response_model=UserApprovalActionResponse)
def approve_analyst_account(
    user_id: int,
    request: Request,
    current_admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Administrator-only: approve a pending analyst account."""
    ip = get_client_ip(request)
    approved = approve_analyst(db, target_user_id=user_id, admin_user=current_admin, client_ip=ip)
    return UserApprovalActionResponse(
        success=True,
        message=f"Analyst account '{approved.username}' approved. User can now sign in.",
        user_id=approved.id,
        account_status=approved.account_status
    )

@router.post("/admin/reject-analyst/{user_id}", response_model=UserApprovalActionResponse)
def reject_analyst_account(
    user_id: int,
    request: Request,
    current_admin: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Administrator-only: reject an analyst registration."""
    ip = get_client_ip(request)
    rejected = reject_analyst(db, target_user_id=user_id, admin_user=current_admin, client_ip=ip)
    return UserApprovalActionResponse(
        success=True,
        message=f"Analyst account '{rejected.username}' has been rejected.",
        user_id=rejected.id,
        account_status=rejected.account_status
    )
