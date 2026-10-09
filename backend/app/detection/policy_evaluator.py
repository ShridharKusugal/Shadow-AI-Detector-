from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.policy_rule import PolicyRule

class PolicyEvaluator:
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.policy_cache: Dict[int, Dict[str, Any]] = {}
        if db:
            self.load_policies()

    def load_policies(self):
        """Cache latest active policy rules by provider_id."""
        if not self.db:
            return
        rules = self.db.query(PolicyRule).all()
        for r in rules:
            if r.provider_id:
                self.policy_cache[r.provider_id] = {
                    "approval_status": r.approval_status,
                    "risk_weight": r.risk_weight,
                    "version": r.version,
                    "notes": r.notes
                }

    def evaluate(self, match_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate matching provider against corporate policy:
        Returns approval status, baseline risk weight, and policy version.
        """
        match_status = match_result.get("match_status")

        if match_status == "known_non_ai":
            return {
                "approval_status": "non_ai",
                "risk_weight": 0,
                "policy_version": 1,
                "policy_notes": "Standard business infrastructure, excluded from Shadow AI governance."
            }

        provider_id = match_result.get("provider_id")
        if not provider_id or match_status == "unknown":
            return {
                "approval_status": "unknown",
                "risk_weight": 30,  # Baseline caution for uncatalogued domains
                "policy_version": 1,
                "policy_notes": "Destination is not in the recognized AI provider catalog. Subject to anomaly monitoring."
            }

        policy = self.policy_cache.get(provider_id)
        if policy:
            return {
                "approval_status": policy["approval_status"],
                "risk_weight": policy["risk_weight"],
                "policy_version": policy["version"],
                "policy_notes": policy.get("notes", "")
            }

        # Fallback if no specific policy rule exists
        return {
            "approval_status": "requires_review",
            "risk_weight": 50,
            "policy_version": 1,
            "policy_notes": "No explicit policy entry found for provider; default requires_review assigned."
        }
