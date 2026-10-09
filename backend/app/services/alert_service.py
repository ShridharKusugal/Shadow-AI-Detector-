import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException

from app.models.alert import Alert
from app.models.investigation import Investigation
from app.models.user import User
from app.models.audit_log import AuditLog

def list_alerts(
    db: Session,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Dict[str, Any]:
    query = db.query(Alert)
    if status and status != "all":
        query = query.filter(Alert.status == status)
    if severity and severity != "all":
        query = query.filter(Alert.severity == severity)

    total = query.count()
    alerts = query.order_by(desc(Alert.created_at)).offset(offset).limit(limit).all()

    items = []
    for a in alerts:
        ra = a.risk_assessment
        evt = a.event
        reasons = json.loads(ra.detection_reasons_json) if ra and ra.detection_reasons_json else []
        missing = json.loads(ra.missing_evidence_json) if ra and ra.missing_evidence_json else []
        recommendations = json.loads(ra.recommendations_json) if ra and ra.recommendations_json else []
        scoring = json.loads(ra.scoring_breakdown_json) if ra and ra.scoring_breakdown_json else {}

        items.append({
            "id": a.id,
            "uuid": a.alert_uuid,
            "title": a.title,
            "severity": a.severity,
            "risk_score": a.risk_score,
            "status": a.status,
            "summary": a.summary,
            "assigned_user": a.assigned_user.username if a.assigned_user else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
            "event": {
                "id": evt.id,
                "event_uuid": evt.event_uuid,
                "timestamp": evt.timestamp.isoformat() if evt.timestamp else None,
                "device_id": evt.device_id,
                "destination_domain": evt.destination_domain,
                "normalized_domain": evt.normalized_domain,
                "connection_count": evt.connection_count,
                "bytes_out": evt.bytes_out,
                "bytes_in": evt.bytes_in,
                "source_type": evt.source_type
            } if evt else None,
            "assessment": {
                "matched_domain": ra.matched_domain if ra else None,
                "approval_status": ra.approval_status if ra else None,
                "reasons": reasons,
                "missing_evidence": missing,
                "recommendations": recommendations,
                "scoring_breakdown": scoring,
                "ml_review_predicted": ra.ml_review_predicted if ra else False,
                "ml_confidence": ra.ml_confidence if ra else 0.0
            } if ra else None,
            "investigation_count": len(a.investigations)
        })

    return {"total": total, "items": items}

def get_alert_detail(db: Session, alert_id: int) -> Dict[str, Any]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    ra = alert.risk_assessment
    evt = alert.event
    reasons = json.loads(ra.detection_reasons_json) if ra and ra.detection_reasons_json else []
    missing = json.loads(ra.missing_evidence_json) if ra and ra.missing_evidence_json else []
    recommendations = json.loads(ra.recommendations_json) if ra and ra.recommendations_json else []
    scoring = json.loads(ra.scoring_breakdown_json) if ra and ra.scoring_breakdown_json else {}

    investigations = [
        {
            "id": inv.id,
            "user": inv.user.username if inv.user else "System",
            "action_taken": inv.action_taken,
            "note": inv.note,
            "previous_status": inv.previous_status,
            "new_status": inv.new_status,
            "created_at": inv.created_at.isoformat() if inv.created_at else None
        }
        for inv in alert.investigations
    ]

    return {
        "id": alert.id,
        "uuid": alert.alert_uuid,
        "title": alert.title,
        "severity": alert.severity,
        "risk_score": alert.risk_score,
        "status": alert.status,
        "summary": alert.summary,
        "assigned_user": alert.assigned_user.username if alert.assigned_user else None,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
        "updated_at": alert.updated_at.isoformat() if alert.updated_at else None,
        "event": {
            "id": evt.id,
            "event_uuid": evt.event_uuid,
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
            "is_synthetic": evt.is_synthetic
        } if evt else None,
        "assessment": {
            "matched_domain": ra.matched_domain if ra else None,
            "match_type": ra.match_type if ra else None,
            "approval_status": ra.approval_status if ra else None,
            "reasons": reasons,
            "missing_evidence": missing,
            "recommendations": recommendations,
            "scoring_breakdown": scoring,
            "ml_review_predicted": ra.ml_review_predicted if ra else False,
            "ml_confidence": ra.ml_confidence if ra else 0.0
        } if ra else None,
        "investigations": investigations
    }

def update_alert_investigation(
    db: Session,
    alert_id: int,
    action_taken: str,
    note: str,
    new_status: Optional[str] = None,
    assigned_username: Optional[str] = None,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    prev_status = alert.status
    if new_status and new_status in ["open", "in_review", "confirmed_violation", "false_positive", "inconclusive", "closed"]:
        alert.status = new_status

    if assigned_username:
        assigned_u = db.query(User).filter(User.username == assigned_username).first()
        if assigned_u:
            alert.assigned_user_id = assigned_u.id

    alert.updated_at = datetime.now(timezone.utc)

    # Persist investigation entry in MySQL
    inv = Investigation(
        alert_id=alert.id,
        user_id=user_id,
        action_taken=action_taken,
        note=note,
        previous_status=prev_status,
        new_status=alert.status,
        created_at=datetime.now(timezone.utc)
    )
    db.add(inv)

    # Log audit record
    audit = AuditLog(
        user_id=user_id,
        action="alert_investigation_updated",
        resource_type="alert",
        resource_id=str(alert.id),
        details_json=json.dumps({
            "action_taken": action_taken,
            "note": note,
            "previous_status": prev_status,
            "new_status": alert.status
        })
    )
    db.add(audit)

    db.commit()
    db.refresh(alert)
    return get_alert_detail(db, alert.id)
