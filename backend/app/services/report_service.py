import io
import csv
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.network_event import NetworkEvent
from app.models.risk_assessment import RiskAssessment
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.ingestion.processor import sanitize_csv_cell

def get_security_summary_report(db: Session) -> Dict[str, Any]:
    """Compile comprehensive executive security assessment report."""
    total_events = db.query(NetworkEvent).count()
    unapproved_events = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.approval_status == "unapproved")
        .count()
    )
    alerts_by_status = {
        "open": db.query(Alert).filter(Alert.status == "open").count(),
        "in_review": db.query(Alert).filter(Alert.status == "in_review").count(),
        "confirmed_violation": db.query(Alert).filter(Alert.status == "confirmed_violation").count(),
        "false_positive": db.query(Alert).filter(Alert.status == "false_positive").count(),
        "closed": db.query(Alert).filter(Alert.status == "closed").count()
    }

    return {
        "generated_at": datetime_now_iso(),
        "total_monitored_events": total_events,
        "shadow_ai_policy_violations": unapproved_events,
        "incident_resolution_breakdown": alerts_by_status,
        "recommended_enterprise_actions": [
            "Mandate corporate identity integration (SSO) for authorized GenAI providers.",
            "Enforce egress firewall blocks on unapproved consumer AI endpoints.",
            "Schedule quarterly employee policy reviews on data handling guidelines."
        ]
    }

def export_alerts_csv(db: Session) -> str:
    """Generate safe CSV export of alerts protected against CSV formula injection."""
    alerts = db.query(Alert).order_by(desc(Alert.created_at)).limit(1000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Alert UUID", "Created At", "Severity", "Risk Score", "Status",
        "Title", "Device ID", "Destination Domain", "Approval Status", "Assigned Analyst"
    ])

    for a in alerts:
        evt = a.event
        ra = a.risk_assessment
        writer.writerow([
            sanitize_csv_cell(a.alert_uuid),
            sanitize_csv_cell(a.created_at.isoformat() if a.created_at else ""),
            sanitize_csv_cell(a.severity),
            sanitize_csv_cell(a.risk_score),
            sanitize_csv_cell(a.status),
            sanitize_csv_cell(a.title),
            sanitize_csv_cell(evt.device_id if evt else ""),
            sanitize_csv_cell(evt.destination_domain if evt else ""),
            sanitize_csv_cell(ra.approval_status if ra else ""),
            sanitize_csv_cell(a.assigned_user.username if a.assigned_user else "Unassigned")
        ])

    return output.getvalue()

def list_audit_logs(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "user": l.user.username if l.user else "System",
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": json.loads(l.details_json) if l.details_json else {},
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None
        })
    return results

def datetime_now_iso():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
