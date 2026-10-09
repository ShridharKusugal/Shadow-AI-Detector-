import math
from typing import Dict, Any

def calculate_entropy(s: str) -> float:
    """Calculate Shannon entropy of domain string to detect DGA or unusual naming."""
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in dict.fromkeys(list(s))]
    entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
    return round(entropy, 3)

def extract_features(
    event_data: Dict[str, Any],
    match_result: Dict[str, Any],
    policy_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Extract structured numerical and categorical features for risk scoring and ML models.
    """
    bytes_out = float(event_data.get("bytes_out", 0))
    bytes_in = float(event_data.get("bytes_in", 0))
    connections = int(event_data.get("connection_count", 1))
    domain = str(event_data.get("normalized_domain", ""))

    byte_ratio = round(bytes_out / (bytes_in + 1.0), 4)
    outbound_mb = round(bytes_out / (1024.0 * 1024.0), 3)
    inbound_mb = round(bytes_in / (1024.0 * 1024.0), 3)
    entropy = calculate_entropy(domain)

    # Heuristic anomaly flags
    high_outbound_anomaly = bytes_out > 5_000_000  # > 5 MB
    high_frequency_anomaly = connections > 50

    is_ai = match_result.get("is_ai_service", False)
    approval_status = policy_result.get("approval_status", "unknown")
    is_unapproved = approval_status == "unapproved"
    requires_review = approval_status == "requires_review"

    return {
        "bytes_out": bytes_out,
        "bytes_in": bytes_in,
        "outbound_mb": outbound_mb,
        "inbound_mb": inbound_mb,
        "connection_count": connections,
        "byte_ratio": byte_ratio,
        "domain_entropy": entropy,
        "high_outbound_anomaly": high_outbound_anomaly,
        "high_frequency_anomaly": high_frequency_anomaly,
        "is_ai_service": 1 if is_ai else 0,
        "is_unapproved": 1 if is_unapproved else 0,
        "requires_review": 1 if requires_review else 0,
        "risk_weight": policy_result.get("risk_weight", 0)
    }
