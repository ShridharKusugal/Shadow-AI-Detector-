from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.catalog_service import list_providers, create_provider
from app.services.auth_service import require_role
from app.models.user import User

router = APIRouter(prefix="/catalog", tags=["AI Provider Catalog"])

@router.get("/inventory")
def get_inventory_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    from sqlalchemy import func
    from app.models.network_event import NetworkEvent
    from app.models.risk_assessment import RiskAssessment
    from app.models.ai_provider import AIProvider
    
    results = (
        db.query(
            AIProvider.name,
            NetworkEvent.normalized_domain,
            RiskAssessment.approval_status,
            func.count(NetworkEvent.id).label("event_count"),
            func.sum(NetworkEvent.bytes_out).label("total_bytes_out"),
            func.min(NetworkEvent.timestamp).label("first_seen"),
            func.max(NetworkEvent.timestamp).label("last_seen"),
            func.max(RiskAssessment.risk_score).label("max_risk_score")
        )
        .join(RiskAssessment, NetworkEvent.id == RiskAssessment.event_id)
        .outerjoin(AIProvider, RiskAssessment.provider_id == AIProvider.id)
        .group_by(
            AIProvider.name,
            NetworkEvent.normalized_domain,
            RiskAssessment.approval_status
        )
        .order_by(func.count(NetworkEvent.id).desc())
        .all()
    )
    
    inventory = []
    for r in results:
        risk = r.max_risk_score or 0
        severity = "critical" if risk >= 85 else "high" if risk >= 60 else "medium" if risk >= 30 else "low"
        inventory.append({
            "provider_name": r.name or "Unknown",
            "endpoint": r.normalized_domain,
            "approval_status": r.approval_status,
            "event_count": r.event_count,
            "estimated_usage_bytes": int(r.total_bytes_out or 0),
            "first_seen": r.first_seen.isoformat() if r.first_seen else None,
            "last_seen": r.last_seen.isoformat() if r.last_seen else None,
            "max_risk_score": risk,
            "severity": severity
        })
    return inventory

@router.get("/providers")
def get_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    return list_providers(db)

@router.post("/providers")
def add_provider(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    provider = create_provider(db, data, user_id=current_user.id)
    return {"message": "AI Provider created successfully", "id": provider.id, "slug": provider.slug}
