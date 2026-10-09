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
    # 1. Seed Users if not present
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@shadow-ai-defense.corp",
            hashed_password=hash_password("AdminSecure2026!"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)

    analyst_user = db.query(User).filter(User.username == "analyst").first()
    if not analyst_user:
        analyst_user = User(
            username="analyst",
            email="analyst@shadow-ai-defense.corp",
            hashed_password=hash_password("AnalystSecure2026!"),
            role="analyst",
            is_active=True
        )
        db.add(analyst_user)

    viewer_user = db.query(User).filter(User.username == "viewer").first()
    if not viewer_user:
        viewer_user = User(
            username="viewer",
            email="viewer@shadow-ai-defense.corp",
            hashed_password=hash_password("ViewerSecure2026!"),
            role="viewer",
            is_active=True
        )
        db.add(viewer_user)

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
