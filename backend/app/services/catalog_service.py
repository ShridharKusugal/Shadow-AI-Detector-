from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.ai_provider import AIProvider
from app.models.provider_domain import ProviderDomain
from app.models.policy_rule import PolicyRule

def list_providers(db: Session) -> List[Dict[str, Any]]:
    providers = db.query(AIProvider).filter(AIProvider.is_active == True).all()
    results = []
    for p in providers:
        domains = [{"id": d.id, "pattern": d.domain_pattern, "match_type": d.match_type, "source": d.source_reference} for d in p.domains]
        policy = p.policies[0] if p.policies else None
        results.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "category": p.category,
            "description": p.description,
            "risk_default": p.risk_default,
            "verification_status": p.verification_status,
            "verification_date": p.verification_date,
            "notes": p.notes,
            "domains": domains,
            "policy": {
                "id": policy.id,
                "approval_status": policy.approval_status,
                "risk_weight": policy.risk_weight,
                "version": policy.version
            } if policy else None
        })
    return results

def create_provider(db: Session, data: Dict[str, Any], user_id: Optional[int] = None) -> AIProvider:
    existing = db.query(AIProvider).filter(AIProvider.slug == data["slug"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Provider slug already exists")

    provider = AIProvider(
        name=data["name"],
        slug=data["slug"],
        category=data.get("category", "Generative AI"),
        description=data.get("description", ""),
        risk_default=data.get("risk_default", "medium"),
        verification_status=data.get("verification_status", "verified"),
        verification_date=data.get("verification_date"),
        notes=data.get("notes", "")
    )
    db.add(provider)
    db.flush()

    for dom in data.get("domains", []):
        d_obj = ProviderDomain(
            provider_id=provider.id,
            domain_pattern=dom["pattern"].strip().lower(),
            match_type=dom.get("match_type", "exact"),
            source_reference=dom.get("source", "Analyst Submission")
        )
        db.add(d_obj)

    # Add default policy
    pol_obj = PolicyRule(
        provider_id=provider.id,
        rule_name=f"{provider.name} Policy",
        approval_status=data.get("approval_status", "requires_review"),
        risk_weight=data.get("risk_weight", 50),
        version=1,
        notes=f"Initial policy created for {provider.name}",
        updated_by_user_id=user_id
    )
    db.add(pol_obj)

    db.commit()
    db.refresh(provider)
    return provider
