"""
End-to-End Workflow Verification for Shadow AI Detector.
Executes the exact 13-step lifecycle specified in the project requirements.
"""

import os
import sys
import datetime

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.database.session import engine, SessionLocal
from app.models import (
    Base, User, AIProvider, ProviderDomain, PolicyRule,
    NetworkEvent, RiskAssessment, Alert, Investigation, IngestionBatch
)
from app.database.init_db import init_db
from app.ingestion.processor import CSVProcessor
from app.services.dashboard_service import get_dashboard_metrics
from app.services.alert_service import update_alert_investigation, get_alert_detail

def run_end_to_end_test():
    print("=" * 70)
    print("STARTING 13-STEP END-TO-END WORKFLOW VERIFICATION TEST")
    print("=" * 70)

    # Step 1: Initialize the application
    print("[Step 1/13] Initializing application schema and database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    init_db(db)
    print("  -> Application schema and initial seed initialized.")

    # Step 2: Connect to MySQL
    print("[Step 2/13] Connecting to MySQL 8.x database...")
    res = db.execute(text("SELECT VERSION(), DATABASE();")).fetchone()
    print(f"  -> Connected to MySQL successfully: Version={res[0]}, Database={res[1]}")
    assert "shadow_ai_detector" in res[1], "Database name must be shadow_ai_detector"

    # Step 3: Check and load the synthetic CSV
    print("[Step 3/13] Locating generated synthetic CSV dataset...")
    root_dir = os.path.dirname(backend_dir)
    csv_path = os.path.join(root_dir, "data", "sample", "shadow_ai_events_synthetic.csv")
    assert os.path.exists(csv_path), f"Synthetic dataset missing at {csv_path}"
    with open(csv_path, "rb") as f:
        csv_bytes = f.read()
    print(f"  -> Loaded {len(csv_bytes)} bytes from {csv_path}")

    # Step 4: Upload/process the file through the ingestion pipeline
    print("[Step 4/13] Processing CSV through ingestion pipeline & detection engine...")
    processor = CSVProcessor(db)
    ingestion_res = processor.process_csv_content(
        file_content=csv_bytes,
        file_name="shadow_ai_events_synthetic.csv",
        source_type="demo",
        is_synthetic=True
    )
    assert ingestion_res["success"] is True, "Ingestion must succeed"
    print(f"  -> Batch UUID: {ingestion_res['batch_uuid']}")
    print(f"  -> Total Rows: {ingestion_res['total_rows']}, Valid: {ingestion_res['valid_rows']}")

    # Step 5: Validate and process records
    print("[Step 5/13] Validating ingested records in MySQL...")
    batch_id = ingestion_res["batch_id"]
    batch = db.query(IngestionBatch).filter(IngestionBatch.id == batch_id).first()
    assert batch is not None, "Batch record must exist in MySQL"
    assert batch.status == "completed", "Batch status must be completed"
    assert batch.valid_count >= 3000, f"Expected >= 3000 valid rows, got {batch.valid_count}"

    # Step 6: Match known services
    print("[Step 6/13] Verifying provider catalog matches...")
    matched_events_count = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.provider_id.isnot(None))
        .count()
    )
    print(f"  -> Total events matched to AI Providers: {matched_events_count}")
    assert matched_events_count > 0, "Known services must match provider catalog"

    # Step 7: Evaluate approval policies
    print("[Step 7/13] Verifying corporate policy outcomes...")
    unapproved_count = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.approval_status == "unapproved")
        .count()
    )
    approved_count = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.approval_status == "approved")
        .count()
    )
    print(f"  -> Unapproved (Shadow AI) events: {unapproved_count}")
    print(f"  -> Approved events: {approved_count}")
    assert unapproved_count > 0, "Unapproved policy matches must be identified"

    # Step 8: Calculate risk scores
    print("[Step 8/13] Verifying transparent 0-100 risk scoring breakdown...")
    sample_ra = db.query(RiskAssessment).filter(RiskAssessment.risk_score > 60).first()
    assert sample_ra is not None, "High risk assessment must exist"
    assert 0 <= sample_ra.risk_score <= 100, "Risk score must be within 0-100"
    assert sample_ra.scoring_breakdown_json is not None, "Scoring breakdown must be stored"
    print(f"  -> Sample High-Risk Assessment: Score={sample_ra.risk_score}, Severity={sample_ra.severity}")

    # Step 9: Save events, assessments and alerts in MySQL
    print("[Step 9/13] Verifying persistence of events, assessments, and alerts...")
    event_count = db.query(NetworkEvent).count()
    ra_count = db.query(RiskAssessment).count()
    alert_count = db.query(Alert).count()
    print(f"  -> In MySQL: {event_count} Events, {ra_count} RiskAssessments, {alert_count} Alerts")
    assert event_count >= 3000
    assert ra_count >= 3000
    assert alert_count > 0

    # Step 10: View actual results on the dashboard
    print("[Step 10/13] Verifying live dashboard aggregation service...")
    metrics = get_dashboard_metrics(db)
    assert metrics["summary"]["total_events"] == event_count
    assert metrics["summary"]["total_alerts"] == alert_count
    assert len(metrics["provider_distribution"]) > 0
    assert len(metrics["activity_timeline"]) > 0
    print(f"  -> Dashboard summary verified: Total={metrics['summary']['total_events']}, Open Alerts={metrics['summary']['open_alerts']}")

    # Step 11: Open an alert and add an investigation note
    print("[Step 11/13] Opening an alert and logging analyst investigation finding...")
    target_alert = db.query(Alert).filter(Alert.status == "open").first()
    assert target_alert is not None, "An open alert must exist for investigation"
    test_alert_id = target_alert.id
    admin_user = db.query(User).filter(User.username == "admin").first()

    investigation_note = "E2E Test Analyst Finding: Verified unsanctioned tool usage by developer. Escalating to manager."
    updated_detail = update_alert_investigation(
        db=db,
        alert_id=test_alert_id,
        action_taken="incident_reviewed",
        note=investigation_note,
        new_status="in_review",
        assigned_username="admin",
        user_id=admin_user.id
    )
    assert updated_detail["status"] == "in_review", "Alert status must change to in_review"
    assert any(inv["note"] == investigation_note for inv in updated_detail["investigations"]), "Investigation note must appear in drawer"
    print(f"  -> Investigation logged on Alert ID {test_alert_id}: New Status='{updated_detail['status']}'")

    # Step 12: Restart application (simulate process restart by closing session & clearing engine pools)
    print("[Step 12/13] Simulating application restart & connection pool teardown...")
    db.close()
    engine.dispose()
    print("  -> Session closed, engine connection pool disposed.")

    # Step 13: Verify that records and investigation history persist in MySQL
    print("[Step 13/13] Reconnecting and asserting persistent records across restart...")
    new_db = SessionLocal()
    try:
        reopened_alert = get_alert_detail(new_db, test_alert_id)
        assert reopened_alert is not None, "Alert must survive application restart"
        assert reopened_alert["status"] == "in_review", f"Persisted status must be 'in_review', got {reopened_alert['status']}"
        assert reopened_alert["assigned_user"] == "admin"
        assert len(reopened_alert["investigations"]) >= 1, "Investigation history must persist"
        assert reopened_alert["investigations"][-1]["note"] == investigation_note

        # Verify all events survived
        survived_events = new_db.query(NetworkEvent).count()
        assert survived_events == event_count, f"All {event_count} events must persist across restart"
        print(f"  -> Verified persistence: All {survived_events} events and investigation note survived restart perfectly!")
    finally:
        new_db.close()

    print("=" * 70)
    print("ALL 13 STEPS OF THE END-TO-END WORKFLOW PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_end_to_end_test()
