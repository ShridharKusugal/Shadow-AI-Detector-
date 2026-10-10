import json
import os
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.network_event import NetworkEvent
from app.models.risk_assessment import RiskAssessment
from app.models.alert import Alert
from app.models.ai_provider import AIProvider
from app.models.ingestion_batch import IngestionBatch
from app.models.model_evaluation import ModelEvaluation

def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
    """Retrieve comprehensive live security dashboard metrics directly from MySQL."""
    total_events = db.query(func.count(NetworkEvent.id)).scalar() or 0

    if total_events == 0:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        root_dir = os.path.dirname(backend_dir)
        csv_path = os.path.join(root_dir, "data", "sample", "shadow_ai_events_synthetic.csv")
        if os.path.exists(csv_path):
            try:
                from app.ingestion.processor import CSVProcessor
                with open(csv_path, "rb") as f:
                    file_content = f.read()
                processor = CSVProcessor(db)
                processor.process_csv_content(
                    file_content=file_content,
                    file_name="shadow_ai_events_synthetic.csv",
                    source_type="demo",
                    is_synthetic=True
                )
                total_events = db.query(func.count(NetworkEvent.id)).scalar() or 0
            except Exception as e:
                print(f"Notice: Dashboard auto-ingestion notice: {e}")

    # Count known AI events (where risk assessment has provider_id or matched_domain)
    known_ai_events = (
        db.query(func.count(RiskAssessment.id))
        .filter(RiskAssessment.approval_status.in_(["approved", "unapproved", "requires_review"]))
        .scalar() or 0
    )

    # Count unapproved events (Shadow AI)
    unapproved_events = (
        db.query(func.count(RiskAssessment.id))
        .filter(RiskAssessment.approval_status == "unapproved")
        .scalar() or 0
    )

    # Alerts breakdown
    total_alerts = db.query(func.count(Alert.id)).scalar() or 0
    open_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "open").scalar() or 0
    critical_alerts = db.query(func.count(Alert.id)).filter(Alert.severity == "critical").scalar() or 0
    high_alerts = db.query(func.count(Alert.id)).filter(Alert.severity == "high").scalar() or 0
    in_review_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "in_review").scalar() or 0

    # Risk distribution
    risk_distribution = {
        "low": db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.severity == "low").scalar() or 0,
        "medium": db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.severity == "medium").scalar() or 0,
        "high": db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.severity == "high").scalar() or 0,
        "critical": db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.severity == "critical").scalar() or 0,
    }

    # Provider distribution (top 8)
    provider_counts = (
        db.query(AIProvider.name, func.count(RiskAssessment.id).label("count"))
        .join(RiskAssessment, RiskAssessment.provider_id == AIProvider.id)
        .group_by(AIProvider.name)
        .order_by(desc("count"))
        .limit(8)
        .all()
    )
    provider_distribution = [{"name": p[0], "count": p[1]} for p in provider_counts]

    # Daily activity trend (last 14 active days)
    date_trunc = func.date(NetworkEvent.timestamp)
    timeline_query = (
        db.query(date_trunc.label("event_date"), func.count(NetworkEvent.id).label("total_count"))
        .group_by(date_trunc)
        .order_by(date_trunc)
        .limit(30)
        .all()
    )
    activity_timeline = [{"date": str(r[0]), "events": r[1]} for r in timeline_query]

    # Recent alerts
    recent_alerts_query = (
        db.query(Alert)
        .order_by(desc(Alert.created_at))
        .limit(6)
        .all()
    )
    recent_alerts = [
        {
            "id": a.id,
            "uuid": a.alert_uuid,
            "title": a.title,
            "severity": a.severity,
            "risk_score": a.risk_score,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "summary": a.summary
        }
        for a in recent_alerts_query
    ]

    # Batch and dataset status
    batches = db.query(IngestionBatch).order_by(desc(IngestionBatch.created_at)).limit(5).all()
    batch_summaries = [
        {
            "id": b.id,
            "uuid": b.batch_uuid,
            "file_name": b.file_name,
            "row_count": b.row_count,
            "valid_count": b.valid_count,
            "invalid_count": b.invalid_count,
            "source_type": b.source_type,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        for b in batches
    ]

    # Model status
    latest_eval = db.query(ModelEvaluation).order_by(desc(ModelEvaluation.evaluated_at)).first()
    model_status = {
        "is_trained": latest_eval is not None,
        "model_name": latest_eval.model_name if latest_eval else "Model Not Trained",
        "model_version": latest_eval.model_version if latest_eval else "None",
        "evaluated_at": latest_eval.evaluated_at.isoformat() if latest_eval and latest_eval.evaluated_at else None,
        "dataset_type": latest_eval.dataset_type if latest_eval else None
    }

    return {
        "summary": {
            "total_events": total_events,
            "known_ai_events": known_ai_events,
            "unapproved_events": unapproved_events,
            "total_alerts": total_alerts,
            "open_alerts": open_alerts,
            "critical_alerts": critical_alerts,
            "high_alerts": high_alerts,
            "in_review_alerts": in_review_alerts
        },
        "risk_distribution": risk_distribution,
        "provider_distribution": provider_distribution,
        "activity_timeline": activity_timeline,
        "recent_alerts": recent_alerts,
        "recent_batches": batch_summaries,
        "model_status": model_status
    }
