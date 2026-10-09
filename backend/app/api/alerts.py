from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.alert_service import list_alerts, get_alert_detail, update_alert_investigation
from app.services.auth_service import require_role
from app.schemas.common import InvestigationUpdateRequest
from app.models.user import User

router = APIRouter(prefix="/alerts", tags=["Alert Center"])

@router.get("")
def get_alerts(
    status: Optional[str] = Query("all"),
    severity: Optional[str] = Query("all"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    return list_alerts(db, status=status, severity=severity, limit=limit, offset=offset)

@router.get("/{alert_id}")
def get_alert_by_id(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    return get_alert_detail(db, alert_id)

@router.post("/{alert_id}/investigate")
def add_investigation_note(
    alert_id: int,
    payload: InvestigationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"]))
):
    return update_alert_investigation(
        db,
        alert_id=alert_id,
        action_taken=payload.action_taken,
        note=payload.note,
        new_status=payload.new_status,
        assigned_username=payload.assigned_username,
        user_id=current_user.id
    )
