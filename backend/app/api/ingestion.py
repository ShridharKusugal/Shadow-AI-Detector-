import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.services.auth_service import require_role
from app.ingestion.processor import CSVProcessor
from app.models.ingestion_batch import IngestionBatch
from app.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/ingestion", tags=["CSV Ingestion"])

@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"]))
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported for telemetry ingestion")

    content = await file.read()
    if len(content) > settings.MAX_CSV_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of {settings.MAX_CSV_FILE_SIZE_BYTES // (1024*1024)} MB"
        )

    processor = CSVProcessor(db)
    result = processor.process_csv_content(
        file_content=content,
        file_name=file.filename,
        source_type="production_upload",
        is_synthetic=False
    )
    return result

@router.get("/batches")
def list_batches(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    batches = db.query(IngestionBatch).order_by(desc(IngestionBatch.created_at)).limit(limit).all()
    return [
        {
            "id": b.id,
            "uuid": b.batch_uuid,
            "file_name": b.file_name,
            "file_hash": b.file_hash,
            "row_count": b.row_count,
            "valid_count": b.valid_count,
            "invalid_count": b.invalid_count,
            "duplicate_count": b.duplicate_count,
            "source_type": b.source_type,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        for b in batches
    ]

@router.get("/batches/{batch_id}/report")
def get_batch_report(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    batch = db.query(IngestionBatch).filter(IngestionBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Ingestion batch not found")
    report = json.loads(batch.validation_report_json) if batch.validation_report_json else {}
    return {
        "batch_id": batch.id,
        "batch_uuid": batch.batch_uuid,
        "file_name": batch.file_name,
        "status": batch.status,
        "report": report
    }
