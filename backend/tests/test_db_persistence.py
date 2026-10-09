import sys
import os
import uuid
import datetime

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.session import SessionLocal
from app.models import (
    User, AIProvider, ProviderDomain, PolicyRule,
    NetworkEvent, RiskAssessment, Alert, Investigation
)

def test_database_persistence():
    db = SessionLocal()
    try:
        # 1. Read catalog
        providers = db.query(AIProvider).all()
        assert len(providers) >= 12, f"Expected at least 12 providers, got {len(providers)}"

        # 2. Write NetworkEvent
        test_uuid = f"TEST-{uuid.uuid4().hex[:8]}"
        evt = NetworkEvent(
            event_uuid=test_uuid,
            timestamp=datetime.datetime.now(datetime.timezone.utc),
            device_id="DEV-TEST-001",
            destination_domain="deepseek.com",
            normalized_domain="deepseek.com",
            connection_count=15,
            bytes_out=150000,
            bytes_in=450000,
            protocol="HTTPS",
            port=443,
            source_type="test_harness",
            is_synthetic=True
        )
        db.add(evt)
        db.flush()

        # 3. Write RiskAssessment
        prov = db.query(AIProvider).filter(AIProvider.slug == "deepseek").first()
        ra = RiskAssessment(
            event_id=evt.id,
            provider_id=prov.id if prov else None,
            matched_domain="deepseek.com",
            match_type="subdomain",
            approval_status="unapproved",
            risk_score=92,
            severity="critical",
            detection_reasons_json='["Unapproved DeepSeek service detected", "High risk weight 90"]',
            scoring_breakdown_json='{"policy_violation": 75, "anomaly_boost": 17}',
            missing_evidence_json='["No DLP signal available"]',
            recommendations_json='["Quarantine host", "Notify Security Operations"]',
            ml_review_predicted=True,
            ml_confidence=0.96
        )
        db.add(ra)
        db.flush()

        # 4. Write Alert
        alert = Alert(
            alert_uuid=f"ALT-{uuid.uuid4().hex[:8]}",
            event_id=evt.id,
            risk_assessment_id=ra.id,
            title="Critical Shadow AI: DeepSeek Activity",
            severity="critical",
            risk_score=92,
            status="open",
            summary="Device DEV-TEST-001 communicated with unapproved AI service deepseek.com"
        )
        db.add(alert)
        db.flush()

        # 5. Write Investigation note
        admin = db.query(User).filter(User.username == "admin").first()
        inv = Investigation(
            alert_id=alert.id,
            user_id=admin.id if admin else None,
            action_taken="note_added",
            note="Analyst initial review: identified suspicious high outbound egress to deepseek.com",
            previous_status="open",
            new_status="in_review"
        )
        db.add(inv)
        alert.status = "in_review"
        db.commit()

        # 6. Read back and verify relationships
        saved_alert = db.query(Alert).filter(Alert.id == alert.id).first()
        assert saved_alert is not None
        assert saved_alert.event.destination_domain == "deepseek.com"
        assert saved_alert.risk_assessment.risk_score == 92
        assert len(saved_alert.investigations) == 1
        assert saved_alert.investigations[0].note.startswith("Analyst initial review")

        print("SUCCESS: Database read/write, relationships and persistence verified in MySQL.")

        # Cleanup test records
        db.delete(saved_alert)
        db.delete(ra)
        db.delete(evt)
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    test_database_persistence()
