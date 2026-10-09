import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.detection.domain_normalizer import normalize_domain
from app.detection.provider_matcher import ProviderMatcher
from app.detection.policy_evaluator import PolicyEvaluator
from app.detection.feature_extractor import extract_features
from app.detection.risk_scorer import calculate_risk_score
from app.detection.explainability import generate_explanation

def test_domain_normalizer():
    # Valid
    ok, norm, err = normalize_domain("   HTTPS://CHATGPT.COM/login?query=1   ")
    assert ok is True
    assert norm == "chatgpt.com"
    assert err is None

    # Invalid characters / spaces
    ok, norm, err = normalize_domain("invalid domain with spaces.com")
    assert ok is False
    assert "Invalid" in err or "whitespace" in err

    # Empty
    ok, norm, err = normalize_domain("")
    assert ok is False

def test_risk_scorer_and_explainability():
    event_data = {
        "bytes_out": 15_000_000, # 15MB anomaly
        "bytes_in": 500_000,
        "connection_count": 35,
        "normalized_domain": "deepseek.com",
        "device_id": "DEV-TEST-099",
        "source_type": "proxy"
    }
    match_result = {
        "match_status": "known_ai",
        "provider_id": 1,
        "provider_name": "DeepSeek",
        "is_ai_service": True,
        "match_type": "exact"
    }
    policy_result = {
        "approval_status": "unapproved",
        "risk_weight": 90,
        "policy_version": 1
    }

    features = extract_features(event_data, match_result, policy_result)
    assert features["high_outbound_anomaly"] is True
    assert features["is_unapproved"] == 1

    score, severity, breakdown = calculate_risk_score(features, match_result, policy_result)
    assert score >= 70
    assert severity in ["high", "critical"]
    assert breakdown["policy_component"] > 40
    assert breakdown["outbound_volume_anomaly"] > 0

    explanation = generate_explanation(
        event_data, features, match_result, policy_result, score, severity, breakdown
    )
    assert len(explanation["detection_reasons"]) > 0
    assert len(explanation["missing_evidence"]) >= 2
    assert "TLS encryption" in explanation["missing_evidence"][0]
    assert len(explanation["recommendations"]) > 0
