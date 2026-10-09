from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.auth_service import require_role
from app.services.report_service import get_security_summary_report, export_alerts_csv, list_audit_logs
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports & Audit"])

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    return get_security_summary_report(db)

@router.get("/export/alerts.csv")
def download_alerts_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"]))
):
    csv_data = export_alerts_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=shadow_ai_alerts_export.csv"}
    )

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"]))
):
    return list_audit_logs(db, limit=limit)
