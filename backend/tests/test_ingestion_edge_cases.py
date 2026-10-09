import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.session import SessionLocal
from app.ingestion.processor import CSVProcessor
from app.models.ingestion_batch import IngestionBatch

def test_edge_cases_dataset_ingestion():
    root_dir = os.path.dirname(backend_dir)
    edge_csv_path = os.path.join(root_dir, "data", "sample", "shadow_ai_events_edge_cases.csv")
    assert os.path.exists(edge_csv_path), "Edge cases CSV must exist"

    with open(edge_csv_path, "rb") as f:
        content = f.read()

    db = SessionLocal()
    try:
        processor = CSVProcessor(db)
        result = processor.process_csv_content(
            file_content=content,
            file_name="test_edge_cases.csv",
            source_type="edge_case_test",
            is_synthetic=True
        )

        assert result["success"] is True
        assert result["invalid_rows"] > 0, "Edge case dataset must produce invalid row detections"
        assert result["duplicate_rows"] >= 1, "Duplicate row in edge case dataset must be flagged"
        
        # Verify batch record in DB
        batch = db.query(IngestionBatch).filter(IngestionBatch.id == result["batch_id"]).first()
        assert batch is not None
        assert batch.status == "completed"
        assert batch.invalid_count == result["invalid_rows"]

        print(f"Edge case test PASSED: total={result['total_rows']}, valid={result['valid_rows']}, invalid={result['invalid_rows']}, duplicates={result['duplicate_rows']}")

        # Cleanup
        db.delete(batch)
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    test_edge_cases_dataset_ingestion()
