import json
import os
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.ai_provider import AIProvider
from app.models.provider_domain import ProviderDomain
from app.models.policy_rule import PolicyRule
from app.core.security import hash_password

def init_db(db: Session) -> None:
    """Seed initial administrator, analyst, viewer, AI providers catalog, and baseline policies."""
    # 1. Seed or activate core system users
    users_to_seed = [
        ("admin", "admin@shadow-ai-defense.corp", "AdminSecure2026!", "admin"),
        ("shridhar", "ikumbar59@gmail.com", "AdminSecure2026!", "admin"),
        ("analyst", "analyst@shadow-ai-defense.corp", "AnalystSecure2026!", "analyst"),
        ("viewer", "viewer@shadow-ai-defense.corp", "ViewerSecure2026!", "viewer"),
    ]

    for username, email, raw_password, role in users_to_seed:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = User(
                username=username,
                email=email,
                hashed_password=hash_password(raw_password),
                role=role,
                account_status="ACTIVE",
                is_active=True
            )
            db.add(user)
        else:
            user.account_status = "ACTIVE"
            user.is_active = True
            user.role = role

    db.commit()


    # 2. Seed AI Providers and Domains from curated catalog if empty
    provider_count = db.query(AIProvider).count()
    if provider_count == 0:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        root_dir = os.path.dirname(backend_dir)
        catalog_path = os.path.join(root_dir, "data", "provider_catalog", "ai_providers.json")

        if os.path.exists(catalog_path):
            with open(catalog_path, "r", encoding="utf-8") as f:
                catalog_data = json.load(f)

            for prov_data in catalog_data.get("providers", []):
                provider = AIProvider(
                    name=prov_data["name"],
                    slug=prov_data["slug"],
                    category=prov_data.get("category", "Generative AI"),
                    description=prov_data.get("description", ""),
                    risk_default=prov_data.get("risk_default", "medium"),
                    verification_status=prov_data.get("verification_status", "verified"),
                    verification_date=prov_data.get("verification_date"),
                    notes=prov_data.get("notes", ""),
                    is_active=prov_data.get("is_active", True)
                )
                db.add(provider)
                db.flush()

                # Add Domains
                for dom in prov_data.get("domains", []):
                    domain_obj = ProviderDomain(
                        provider_id=provider.id,
                        domain_pattern=dom["pattern"],
                        match_type=dom.get("match_type", "exact"),
                        is_ai_service=dom.get("is_ai_service", True),
                        source_reference=dom.get("source", "Catalog"),
                        verification_status="verified",
                        is_active=True
                    )
                    db.add(domain_obj)

                # Add Policy
                def_pol = prov_data.get("default_policy", {})
                policy_obj = PolicyRule(
                    provider_id=provider.id,
                    rule_name=f"{provider.name} Baseline Policy",
                    approval_status=def_pol.get("approval_status", "requires_review"),
                    risk_weight=def_pol.get("risk_weight", 50),
                    version=1,
                    notes=def_pol.get("notes", "Initial baseline policy rule"),
                    updated_by_user_id=admin_user.id
                )
                db.add(policy_obj)

            db.commit()
            print(f"Initialized database with {len(catalog_data.get('providers', []))} AI providers and baseline policies.")
