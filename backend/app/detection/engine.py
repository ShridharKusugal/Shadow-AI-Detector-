import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from app.detection.domain_normalizer import normalize_domain
from app.detection.provider_matcher import ProviderMatcher
from app.detection.policy_evaluator import PolicyEvaluator
from app.detection.feature_extractor import extract_features
from app.detection.risk_scorer import calculate_risk_score
from app.detection.explainability import generate_explanation
from app.ml.predictor import ml_predictor
from app.models.network_event import NetworkEvent
from app.models.risk_assessment import RiskAssessment
from app.models.alert import Alert

class DetectionEngine:
    def __init__(self, db: Session):
        self.db = db
        self.matcher = ProviderMatcher(db)
        self.evaluator = PolicyEvaluator(db)

    def process_event(
        self,
        event_dict: Dict[str, Any],
        batch_id: Optional[int] = None,
        is_synthetic: bool = False
    ) -> Tuple[Optional[NetworkEvent], Optional[RiskAssessment], Optional[Alert], Optional[str]]:
        """
        Executes end-to-end detection pipeline on a single incoming telemetry event:
        1. Validate & Normalize Domain
        2. Match AI Provider
        3. Evaluate Corporate Policy
        4. Extract Features
        5. Calculate Risk Score
        6. ML Inference
        7. Generate Explanations
        8. Construct ORM Objects (NetworkEvent, RiskAssessment, Alert)
        Returns: (event_obj, assessment_obj, alert_obj, error_message)
        """
        raw_domain = event_dict.get("destination_domain")
        is_valid, norm_domain, err = normalize_domain(raw_domain)
        if not is_valid:
            return None, None, None, f"Invalid domain: {err}"

        # Parse and validate timestamp
        raw_ts = event_dict.get("timestamp")
        try:
            if isinstance(raw_ts, str):
                ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            elif isinstance(raw_ts, datetime):
                ts = raw_ts
            else:
                ts = datetime.now(timezone.utc)
        except Exception:
            return None, None, None, f"Malformed timestamp: {raw_ts}"

        # Validate numeric metrics
        try:
            conns = int(event_dict.get("connection_count", 1))
            bytes_out = int(event_dict.get("bytes_out", 0))
            bytes_in = int(event_dict.get("bytes_in", 0))
            if conns < 0 or bytes_out < 0 or bytes_in < 0:
                return None, None, None, "Negative numeric metrics are invalid"
        except (ValueError, TypeError) as e:
            return None, None, None, f"Non-numeric metric values: {e}"

        device_id = str(event_dict.get("device_id", "")).strip()
        if not device_id:
            return None, None, None, "Missing required device_id"

        # 1. Match Provider
        match_result = self.matcher.match(norm_domain)

        # 2. Evaluate Policy
        policy_result = self.evaluator.evaluate(match_result)

        # 3. Extract Features
        event_summary = {
            "bytes_out": bytes_out,
            "bytes_in": bytes_in,
            "connection_count": conns,
            "normalized_domain": norm_domain,
            "device_id": device_id,
            "source_type": event_dict.get("source_type", "corporate_proxy")
        }
        features = extract_features(event_summary, match_result, policy_result)

        # 4. Calculate Risk Score
        risk_score, severity, scoring_breakdown = calculate_risk_score(features, match_result, policy_result)

        # 5. ML Review Prediction
        ml_review_predicted, ml_confidence = ml_predictor.predict(features)

        # If ML flags high probability review and score is currently lower, consider slight boost
        if ml_review_predicted and ml_confidence > 0.90 and risk_score < 40 and policy_result["approval_status"] != "approved":
            risk_score = max(risk_score, 45)
            severity = "medium"

        # 6. Generate Explainability
        explanation = generate_explanation(
            event_summary,
            features,
            match_result,
            policy_result,
            risk_score,
            severity,
            scoring_breakdown
        )

        # Construct NetworkEvent ORM
        event_uuid = event_dict.get("event_id") or f"EVT-{uuid.uuid4().hex[:12].upper()}"
        event_obj = NetworkEvent(
            batch_id=batch_id,
            event_uuid=event_uuid,
            timestamp=ts,
            device_id=device_id,
            destination_domain=raw_domain,
            normalized_domain=norm_domain,
            connection_count=conns,
            bytes_out=bytes_out,
            bytes_in=bytes_in,
            protocol=event_dict.get("protocol", "HTTPS") or "HTTPS",
            port=int(event_dict.get("port", 443) or 443),
            source_type=event_dict.get("source_type", "corporate_proxy") or "corporate_proxy",
            user_agent=event_dict.get("user_agent", "") or None,
            is_synthetic=is_synthetic,
            raw_data_json=json.dumps(event_dict)
        )

        # Construct RiskAssessment ORM
        ra_obj = RiskAssessment(
            provider_id=match_result.get("provider_id"),
            matched_domain=match_result.get("matched_domain"),
            match_type=match_result.get("match_type"),
            approval_status=policy_result.get("approval_status", "unknown"),
            risk_score=risk_score,
            severity=severity,
            detection_reasons_json=json.dumps(explanation["detection_reasons"]),
            scoring_breakdown_json=json.dumps(scoring_breakdown),
            missing_evidence_json=json.dumps(explanation["missing_evidence"]),
            recommendations_json=json.dumps(explanation["recommendations"]),
            ml_review_predicted=ml_review_predicted,
            ml_confidence=ml_confidence,
            policy_version=policy_result.get("policy_version", 1),
            assessed_at=datetime.now(timezone.utc)
        )

        # Construct Alert ORM if severity >= medium or policy violation
        alert_obj = None
        if severity in ["medium", "high", "critical"] or policy_result.get("approval_status") == "unapproved":
            provider_label = match_result.get("provider_name", norm_domain)
            alert_title = f"{severity.upper()}: Unsanctioned AI Communication - {provider_label}"
            alert_obj = Alert(
                alert_uuid=f"ALT-{uuid.uuid4().hex[:10].upper()}",
                title=alert_title,
                severity=severity,
                risk_score=risk_score,
                status="open",
                summary=f"Device {device_id} communicated with {provider_label} ({norm_domain}) producing risk score {risk_score}/100.",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

        return event_obj, ra_obj, alert_obj, None
