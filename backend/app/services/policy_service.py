import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.policy_rule import PolicyRule
from app.models.ai_provider import AIProvider
from app.models.audit_log import AuditLog

def list_policies(db: Session) -> List[Dict[str, Any]]:
    rules = db.query(PolicyRule, AIProvider).outerjoin(AIProvider, PolicyRule.provider_id == AIProvider.id).all()
    results = []
    for r, prov in rules:
        results.append({
            "id": r.id,
            "provider_id": r.provider_id,
            "provider_name": prov.name if prov else "Global Catch-All",
            "provider_slug": prov.slug if prov else "global",
            "rule_name": r.rule_name,
            "approval_status": r.approval_status,
            "risk_weight": r.risk_weight,
            "version": r.version,
            "notes": r.notes,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None
        })
    return results

def update_policy(
    db: Session,
    policy_id: int,
    approval_status: str,
    risk_weight: int,
    notes: Optional[str] = None,
    user_id: Optional[int] = None,
    client_ip: Optional[str] = None
) -> PolicyRule:
    rule = db.query(PolicyRule).filter(PolicyRule.id == policy_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Policy rule not found")

    old_status = rule.approval_status
    old_weight = rule.risk_weight

    rule.approval_status = approval_status
    rule.risk_weight = max(0, min(100, risk_weight))
    rule.version += 1
    if notes:
        rule.notes = notes
    rule.updated_by_user_id = user_id
    rule.updated_at = datetime.now(timezone.utc)

    # Write audit log
    audit = AuditLog(
        user_id=user_id,
        action="policy_updated",
        resource_type="policy_rule",
        resource_id=str(policy_id),
        details_json=json.dumps({
            "previous_status": old_status,
            "new_status": approval_status,
            "previous_weight": old_weight,
            "new_weight": risk_weight,
            "version": rule.version
        }),
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()
    db.refresh(rule)
    return rule
