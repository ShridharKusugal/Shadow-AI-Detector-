import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from fastapi import HTTPException

from app.models.network_event import NetworkEvent
from app.models.risk_assessment import RiskAssessment
from app.models.ai_provider import AIProvider

def search_events(
    db: Session,
    search: Optional[str] = None,
    approval_status: Optional[str] = None,
    severity: Optional[str] = None,
    device_id: Optional[str] = None,
    sort_by: str = "timestamp",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    query = db.query(NetworkEvent).outerjoin(RiskAssessment, NetworkEvent.id == RiskAssessment.event_id)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (NetworkEvent.destination_domain.ilike(s)) |
            (NetworkEvent.device_id.ilike(s)) |
            (NetworkEvent.event_uuid.ilike(s))
        )
    if approval_status and approval_status != "all":
        query = query.filter(RiskAssessment.approval_status == approval_status)
    if severity and severity != "all":
        query = query.filter(RiskAssessment.severity == severity)
    if device_id:
        query = query.filter(NetworkEvent.device_id == device_id)

    total = query.count()

    order_col = NetworkEvent.timestamp
    if sort_by == "risk_score":
        order_col = RiskAssessment.risk_score
    elif sort_by == "bytes_out":
        order_col = NetworkEvent.bytes_out
    elif sort_by == "connection_count":
        order_col = NetworkEvent.connection_count

    if sort_dir == "asc":
        query = query.order_by(asc(order_col))
    else:
        query = query.order_by(desc(order_col))

    events = query.offset(offset).limit(limit).all()

    items = []
    for evt in events:
        ra = evt.risk_assessment
        reasons = json.loads(ra.detection_reasons_json) if ra and ra.detection_reasons_json else []
        items.append({
            "id": evt.id,
            "uuid": evt.event_uuid,
            "timestamp": evt.timestamp.isoformat() if evt.timestamp else None,
            "device_id": evt.device_id,
            "destination_domain": evt.destination_domain,
            "normalized_domain": evt.normalized_domain,
            "connection_count": evt.connection_count,
            "bytes_out": evt.bytes_out,
            "bytes_in": evt.bytes_in,
            "source_type": evt.source_type,
            "is_synthetic": evt.is_synthetic,
            "risk_score": ra.risk_score if ra else 0,
            "severity": ra.severity if ra else "low",
            "approval_status": ra.approval_status if ra else "unknown",
            "provider_name": ra.provider.name if ra and ra.provider else "Unknown / None",
            "detection_reasons": reasons
        })

    return {"total": total, "items": items}

def get_event_detail(db: Session, event_id: int) -> Dict[str, Any]:
    evt = db.query(NetworkEvent).filter(NetworkEvent.id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Network event not found")

    ra = evt.risk_assessment
    reasons = json.loads(ra.detection_reasons_json) if ra and ra.detection_reasons_json else []
    scoring = json.loads(ra.scoring_breakdown_json) if ra and ra.scoring_breakdown_json else {}
    missing = json.loads(ra.missing_evidence_json) if ra and ra.missing_evidence_json else []
    recommendations = json.loads(ra.recommendations_json) if ra and ra.recommendations_json else []

    return {
        "id": evt.id,
        "uuid": evt.event_uuid,
        "timestamp": evt.timestamp.isoformat() if evt.timestamp else None,
        "device_id": evt.device_id,
        "destination_domain": evt.destination_domain,
        "normalized_domain": evt.normalized_domain,
        "connection_count": evt.connection_count,
        "bytes_out": evt.bytes_out,
        "bytes_in": evt.bytes_in,
        "protocol": evt.protocol,
        "port": evt.port,
        "source_type": evt.source_type,
        "user_agent": evt.user_agent,
        "is_synthetic": evt.is_synthetic,
        "assessment": {
            "id": ra.id if ra else None,
            "provider_name": ra.provider.name if ra and ra.provider else None,
            "matched_domain": ra.matched_domain if ra else None,
            "match_type": ra.match_type if ra else None,
            "approval_status": ra.approval_status if ra else "unknown",
            "risk_score": ra.risk_score if ra else 0,
            "severity": ra.severity if ra else "low",
            "detection_reasons": reasons,
            "scoring_breakdown": scoring,
            "missing_evidence": missing,
            "recommendations": recommendations,
            "ml_review_predicted": ra.ml_review_predicted if ra else False,
            "ml_confidence": ra.ml_confidence if ra else 0.0,
            "policy_version": ra.policy_version if ra else 1,
            "assessed_at": ra.assessed_at.isoformat() if ra and ra.assessed_at else None
        } if ra else None
    }
