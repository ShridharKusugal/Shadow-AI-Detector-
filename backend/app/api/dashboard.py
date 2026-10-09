import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.dashboard_service import get_dashboard_metrics
from app.services.auth_service import get_current_user, require_role
from app.ingestion.processor import CSVProcessor
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_metrics(db)

@router.post("/load-demo-data")
def load_synthetic_demo_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"]))
):
    """
    Ingests the pre-generated synthetic dataset through the real detection pipeline into MySQL.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    csv_path = os.path.join(base_dir, "data", "sample", "shadow_ai_events_synthetic.csv")
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Synthetic sample file not found. Please regenerate.")

    with open(csv_path, "rb") as f:
        file_content = f.read()

    processor = CSVProcessor(db)
    result = processor.process_csv_content(
        file_content=file_content,
        file_name="shadow_ai_events_synthetic.csv",
        source_type="demo",
        is_synthetic=True
    )
    return {
        "message": "Synthetic demo data successfully ingested into MySQL through detection engine",
        "result": result
    }
