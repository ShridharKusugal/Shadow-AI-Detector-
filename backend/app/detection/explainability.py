from typing import Dict, Any, List

def generate_explanation(
    event_data: Dict[str, Any],
    features: Dict[str, Any],
    match_result: Dict[str, Any],
    policy_result: Dict[str, Any],
    risk_score: int,
    severity: str,
    scoring_breakdown: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Produce comprehensive explainability structure:
    1. Detection Reasons
    2. Missing Evidence (explicitly acknowledging limitations of TLS/proxy metadata)
    3. Actionable Security Recommendations
    """
    domain = event_data.get("normalized_domain", "")
    device_id = event_data.get("device_id", "Unknown Device")
    bytes_out = event_data.get("bytes_out", 0)
    bytes_in = event_data.get("bytes_in", 0)
    connections = event_data.get("connection_count", 1)

    provider_name = match_result.get("provider_name", "Unclassified")
    match_type = match_result.get("match_type", "none")
    approval_status = policy_result.get("approval_status", "unknown")

    reasons: List[str] = []
    recommendations: List[str] = []
    missing_evidence: List[str] = []

    # 1. Detection Reasons
    if match_result.get("is_ai_service"):
        reasons.append(
            f"Observed network traffic matching recognized AI provider '{provider_name}' via {match_type} rule for '{domain}'."
        )
    elif match_result.get("match_status") == "known_non_ai":
        reasons.append(
            f"Destination '{domain}' matched known non-AI enterprise infrastructure."
        )
    else:
        reasons.append(
            f"Destination '{domain}' is not in the curated AI catalog; unclassified external communication."
        )

    if approval_status == "unapproved":
        reasons.append(
            f"Corporate policy violation: '{provider_name}' is designated UNAPPROVED for corporate network egress."
        )
    elif approval_status == "requires_review":
        reasons.append(
            f"Compliance flag: '{provider_name}' requires organizational security review or enterprise tenant verification."
        )
    elif approval_status == "approved":
        reasons.append(
            f"Authorized service: '{provider_name}' is sanctioned under corporate AI governance."
        )

    if scoring_breakdown.get("outbound_volume_anomaly", 0) > 0:
        outbound_mb = round(bytes_out / (1024 * 1024), 2)
        reasons.append(
            f"Anomalous outbound volume: {outbound_mb} MB sent by device '{device_id}', exceeding baseline egress thresholds."
        )

    if scoring_breakdown.get("connection_velocity_anomaly", 0) > 0:
        reasons.append(
            f"High connection velocity: {connections} aggregated sessions observed in the telemetry window."
        )

    # 2. Missing Evidence (CRITICAL INTEGRITY SECTION)
    missing_evidence.append(
        "Payload / Prompt Content: Unavailable. Standard TLS encryption prevents inspection of plain-text prompts, source code snippets, or conversational inputs without an authorized TLS-terminating forward proxy."
    )
    missing_evidence.append(
        "DLP Verification: No correlated Data Loss Prevention (DLP) incident alert detected for this device session."
    )
    if "edr_telemetry" not in str(event_data.get("source_type", "")):
        missing_evidence.append(
            "Host Process Identity: No EDR process binding available to determine which specific application or browser tab initiated the connection."
        )

    # 3. Actionable Security Recommendations
    if severity == "critical":
        recommendations.append(
            f"Immediate Analyst Action: Isolate or verify device '{device_id}' to assess unsanctioned tool usage."
        )
        recommendations.append(
            "Correlate EDR logs to identify the user process, browser profile, and files read immediately prior to the connection."
        )
        recommendations.append(
            f"Enforce perimeter DNS/Proxy blackholing for domain '{domain}' across corporate firewalls."
        )
    elif severity == "high":
        recommendations.append(
            f"Notify device owner '{device_id}' regarding policy violation concerning unapproved AI tool '{provider_name}'."
        )
        recommendations.append(
            "Request user confirmation of whether proprietary data, source code, or credentials were input."
        )
    elif severity == "medium":
        recommendations.append(
            f"Review access justification for '{provider_name}' and guide user toward sanctioned enterprise equivalents."
        )
    else:
        recommendations.append(
            "No immediate containment required. Maintain routine telemetry monitoring."
        )

    return {
        "detection_reasons": reasons,
        "missing_evidence": missing_evidence,
        "recommendations": recommendations
    }
