import io
import csv
import json
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session

from app.models.ingestion_batch import IngestionBatch
from app.models.network_event import NetworkEvent
from app.detection.engine import DetectionEngine

REQUIRED_COLUMNS = ["event_id", "timestamp", "device_id", "destination_domain"]

def sanitize_csv_cell(value: Any) -> Any:
    """Protect against CSV formula injection (OWASP CSV Injection)."""
    if isinstance(value, str):
        if value and value[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + value
    return value

class CSVProcessor:
    def __init__(self, db: Session):
        self.db = db
        self.engine = DetectionEngine(db)

    def process_csv_content(
        self,
        file_content: bytes,
        file_name: str,
        source_type: str = "production_upload",
        is_synthetic: bool = False
    ) -> Dict[str, Any]:
        """
        Process CSV stream, validate rows, run detection engine, persist batch and events into MySQL.
        """
        file_hash = hashlib.sha256(file_content).hexdigest()

        # Check existing batch with exact hash
        existing = self.db.query(IngestionBatch).filter(IngestionBatch.file_hash == file_hash).first()
        if existing is not None and existing.status == "completed":
            # If it's a synthetic dataset but we have 0 network events, bypass deduplication
            # because the database might have been cleared or partially reset.
            if is_synthetic:
                event_count = self.db.query(NetworkEvent).count()
                if event_count == 0:
                    pass # Bypass dedup and continue ingestion
                else:
                    return {
                        "success": True,
                        "batch_id": existing.id,
                        "batch_uuid": existing.batch_uuid,
                        "total_rows": existing.row_count,
                        "valid_rows": existing.valid_count,
                        "invalid_rows": existing.invalid_count,
                        "duplicate_rows": existing.duplicate_count,
                        "message": "File was already ingested previously. Deduplication skipped reprocessing."
                    }
            else:
                return {
                    "success": True,
                    "batch_id": existing.id,
                    "batch_uuid": existing.batch_uuid,
                    "total_rows": existing.row_count,
                    "valid_rows": existing.valid_count,
                    "invalid_rows": existing.invalid_count,
                    "duplicate_rows": existing.duplicate_count,
                    "message": "File was already ingested previously. Deduplication skipped reprocessing."
                }

        batch_uuid = f"BATCH-{uuid.uuid4().hex[:12].upper()}"
        batch = IngestionBatch(
            batch_uuid=batch_uuid,
            file_name=file_name,
            file_hash=file_hash,
            source_type=source_type,
            status="processing",
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(batch)
        self.db.flush()

        text_stream = io.StringIO(file_content.decode("utf-8", errors="replace"))
        reader = csv.DictReader(text_stream)

        # Preflight column check
        fieldnames = [c.strip() for c in (reader.fieldnames or [])]
        missing_cols = [col for col in REQUIRED_COLUMNS if col not in fieldnames]
        if missing_cols:
            batch.status = "failed"
            batch.validation_report_json = json.dumps({
                "error": f"Missing required CSV columns: {missing_cols}",
                "observed_columns": fieldnames
            })
            self.db.commit()
            return {
                "success": False,
                "batch_id": batch.id,
                "error": f"Missing required columns: {missing_cols}",
                "valid_count": 0,
                "invalid_count": 0
            }

        total_rows = 0
        valid_rows = 0
        invalid_rows: List[Dict[str, Any]] = []
        duplicate_rows = 0

        # Pre-load existing database event_uuids in 1 single fast query
        existing_db_uuids = set(
            r[0] for r in self.db.query(NetworkEvent.event_uuid).all()
        )
        seen_event_ids = set()

        for row_idx, raw_row in enumerate(reader, start=1):
            total_rows += 1
            row = {k.strip(): v.strip() if isinstance(v, str) else v for k, v in raw_row.items() if k}

            evt_id = row.get("event_id")
            if evt_id:
                if evt_id in seen_event_ids:
                    duplicate_rows += 1
                    invalid_rows.append({
                        "row_number": row_idx,
                        "event_id": evt_id,
                        "reason": "Duplicate event_id within batch",
                        "raw_data": row
                    })
                    continue
                
                if evt_id in existing_db_uuids:
                    duplicate_rows += 1
                    invalid_rows.append({
                        "row_number": row_idx,
                        "event_id": evt_id,
                        "reason": "Duplicate event_id already exists in database",
                        "raw_data": row
                    })
                    continue

                seen_event_ids.add(evt_id)

            # Run detection engine
            evt_obj, ra_obj, alert_obj, error = self.engine.process_event(
                row, batch_id=batch.id, is_synthetic=is_synthetic
            )

            if error:
                invalid_rows.append({
                    "row_number": row_idx,
                    "event_id": evt_id or f"ROW-{row_idx}",
                    "reason": error,
                    "raw_data": row
                })
                continue

            valid_rows += 1
            self.db.add(evt_obj)
            self.db.flush()  # to obtain evt_obj.id

            ra_obj.event_id = evt_obj.id
            self.db.add(ra_obj)
            self.db.flush()  # to obtain ra_obj.id

            if alert_obj:
                alert_obj.event_id = evt_obj.id
                alert_obj.risk_assessment_id = ra_obj.id
                self.db.add(alert_obj)

            # Periodic commit every 500 rows
            if valid_rows % 500 == 0:
                self.db.commit()

        validation_report = {
            "batch_uuid": batch_uuid,
            "file_name": file_name,
            "file_hash": file_hash,
            "is_duplicate_file_hash": False,
            "total_rows": total_rows,
            "valid_rows": valid_rows,
            "invalid_rows_count": len(invalid_rows),
            "duplicate_rows_count": duplicate_rows,
            "invalid_rows_sample": invalid_rows[:50]  # Store first 50 errors in report
        }

        batch.row_count = total_rows
        batch.valid_count = valid_rows
        batch.invalid_count = len(invalid_rows)
        batch.duplicate_count = duplicate_rows
        batch.status = "completed"
        batch.validation_report_json = json.dumps(validation_report)
        self.db.commit()

        return {
            "success": True,
            "batch_id": batch.id,
            "batch_uuid": batch_uuid,
            "total_rows": total_rows,
            "valid_rows": valid_rows,
            "invalid_rows": len(invalid_rows),
            "duplicate_rows": duplicate_rows,
            "validation_report": validation_report
        }
