from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.event_service import search_events, get_event_detail
from app.services.auth_service import require_role
from app.models.user import User

router = APIRouter(prefix="/events", tags=["Event Explorer"])

@router.get("")
def get_events(
    search: Optional[str] = Query(None),
    approval_status: Optional[str] = Query("all"),
    severity: Optional[str] = Query("all"),
    device_id: Optional[str] = Query(None),
    sort_by: str = Query("timestamp"),
    sort_dir: str = Query("desc"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    return search_events(
        db, search=search, approval_status=approval_status,
        severity=severity, device_id=device_id,
        sort_by=sort_by, sort_dir=sort_dir, limit=limit, offset=offset
    )

@router.get("/{event_id}")
def get_single_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    return get_event_detail(db, event_id)
