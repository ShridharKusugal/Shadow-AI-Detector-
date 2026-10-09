from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.policy_service import list_policies, update_policy
from app.services.auth_service import require_role
from app.schemas.common import PolicyUpdateRequest
from app.models.user import User

router = APIRouter(prefix="/policy", tags=["Policy Management"])

@router.get("/rules")
def get_policy_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    return list_policies(db)

@router.put("/rules/{rule_id}")
def modify_policy_rule(
    rule_id: int,
    payload: PolicyUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    client_ip = request.client.host if request.client else None
    rule = update_policy(
        db,
        policy_id=rule_id,
        approval_status=payload.approval_status,
        risk_weight=payload.risk_weight,
        notes=payload.notes,
        user_id=current_user.id,
        client_ip=client_ip
    )
    return {
        "message": "Policy rule updated successfully",
        "id": rule.id,
        "new_version": rule.version,
        "approval_status": rule.approval_status,
        "risk_weight": rule.risk_weight
    }
