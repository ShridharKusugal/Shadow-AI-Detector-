from typing import Dict, Any, Tuple

def calculate_risk_score(
    features: Dict[str, Any],
    match_result: Dict[str, Any],
    policy_result: Dict[str, Any]
) -> Tuple[int, str, Dict[str, Any]]:
    """
    Calculate transparent 0-100 risk score and severity with an itemized scoring breakdown.
    
    Formula:
    1. Base Policy Score (up to 60 pts):
       - Unapproved AI service: 45 - 60 pts (derived from provider risk_weight)
       - Requires review AI service: 20 - 35 pts
       - Unknown destination: 15 - 25 pts
       - Approved AI service: 0 - 15 pts
       - Non-AI known service: 0 pts
    2. Outbound Volume Anomaly (up to 20 pts):
       - > 20 MB: +20 pts
       - > 5 MB: +12 pts
       - > 1 MB: +5 pts
    3. Connection Velocity & Repetition (up to 12 pts):
       - > 50 sessions: +12 pts
       - > 20 sessions: +7 pts
       - > 5 sessions: +3 pts
    4. Domain Entropy / Suspicion (up to 8 pts):
       - Entropy > 3.8: +8 pts
    
    Total capped strictly between 0 and 100.
    """
    approval_status = policy_result.get("approval_status", "unknown")
    risk_weight = policy_result.get("risk_weight", 0)

    breakdown = {
        "policy_component": 0,
        "outbound_volume_anomaly": 0,
        "connection_velocity_anomaly": 0,
        "domain_entropy_component": 0,
        "sensitive_data_signal": 0  # 0 because TLS metadata alone cannot verify payload contents
    }

    # 1. Policy component
    if approval_status == "unapproved":
        # Scale risk_weight (typically 60-90) into 45-60 pts
        breakdown["policy_component"] = min(60, max(45, int(risk_weight * 0.65)))
    elif approval_status == "requires_review":
        breakdown["policy_component"] = min(35, max(20, int(risk_weight * 0.50)))
    elif approval_status == "unknown":
        breakdown["policy_component"] = 20
    elif approval_status == "approved":
        breakdown["policy_component"] = min(15, int(risk_weight * 0.25))
    else:  # non_ai
        breakdown["policy_component"] = 0

    # 2. Outbound volume anomaly
    bytes_out = features.get("bytes_out", 0)
    if bytes_out > 20_000_000:
        breakdown["outbound_volume_anomaly"] = 20
    elif bytes_out > 5_000_000:
        breakdown["outbound_volume_anomaly"] = 12
    elif bytes_out > 1_000_000:
        breakdown["outbound_volume_anomaly"] = 5

    # 3. Connection velocity & repetition
    conns = features.get("connection_count", 1)
    if conns > 50:
        breakdown["connection_velocity_anomaly"] = 12
    elif conns > 20:
        breakdown["connection_velocity_anomaly"] = 7
    elif conns > 5:
        breakdown["connection_velocity_anomaly"] = 3

    # 4. Domain entropy
    entropy = features.get("domain_entropy", 0.0)
    if entropy > 3.8 and approval_status != "approved":
        breakdown["domain_entropy_component"] = 8
    elif entropy > 3.5 and approval_status != "approved":
        breakdown["domain_entropy_component"] = 4

    # Calculate raw total
    raw_score = sum(breakdown.values())

    # If destination is known non-AI, cap score at 10 (unless huge anomalous exfiltration)
    if approval_status == "non_ai":
        raw_score = min(10, raw_score)

    final_score = max(0, min(100, int(raw_score)))

    # Determine severity tier
    if final_score >= 85:
        severity = "critical"
    elif final_score >= 60:
        severity = "high"
    elif final_score >= 30:
        severity = "medium"
    else:
        severity = "low"

    return final_score, severity, breakdown
