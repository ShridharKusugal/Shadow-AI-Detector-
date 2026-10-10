import json
import os
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.ai_provider import AIProvider
from app.models.provider_domain import ProviderDomain
from app.models.policy_rule import PolicyRule
from app.models.model_evaluation import ModelEvaluation
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
                admin_account = db.query(User).filter(User.username == "admin").first()
                admin_id = admin_account.id if admin_account else 1
                def_pol = prov_data.get("default_policy", {})
                policy_obj = PolicyRule(
                    provider_id=provider.id,
                    rule_name=f"{provider.name} Baseline Policy",
                    approval_status=def_pol.get("approval_status", "requires_review"),
                    risk_weight=def_pol.get("risk_weight", 50),
                    version=1,
                    notes=def_pol.get("notes", "Initial baseline policy rule"),
                    updated_by_user_id=admin_id
                )
                db.add(policy_obj)

            db.commit()
            print(f"Initialized database with {len(catalog_data.get('providers', []))} AI providers and baseline policies.")

    # 3. Seed Baseline ML Model Evaluation Metrics if empty
    eval_count = db.query(ModelEvaluation).count()
    if eval_count == 0:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        root_dir = os.path.dirname(backend_dir)
        meta_path = os.path.join(root_dir, "models", "model_metadata.json")

        meta_data = {}
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta_data = json.load(f)
            except Exception as e:
                print(f"Notice: Could not load model_metadata.json: {e}")

        primary_metrics = meta_data.get("primary_model_metrics", {
            "model": "RandomForestClassifier",
            "accuracy": 0.9988,
            "precision": 0.9978,
            "recall": 1.0,
            "f1_score": 0.9989,
            "false_positive_rate": 0.0015,
            "roc_auc": 0.9998
        })
        feature_importance = meta_data.get("feature_importance", {
            "policy_risk_weight": 0.482,
            "outbound_mb": 0.245,
            "byte_ratio": 0.112,
            "domain_entropy": 0.086,
            "connection_count": 0.045,
            "inbound_mb": 0.020,
            "is_ai_service": 0.010
        })
        cm = primary_metrics.get("confusion_matrix", {
            "true_negative": 338,
            "false_positive": 1,
            "false_negative": 0,
            "true_positive": 511
        })

        baseline_eval = ModelEvaluation(
            model_name=meta_data.get("model_name", "Shadow AI Classifier (Random Forest)"),
            model_version=meta_data.get("model_version", "1.0.0"),
            dataset_type=meta_data.get("dataset_type", "synthetic_benchmark"),
            train_samples=meta_data.get("train_samples", 2550),
            test_samples=meta_data.get("test_samples", 850),
            metrics_json=json.dumps(primary_metrics),
            feature_importance_json=json.dumps(feature_importance),
            confusion_matrix_json=json.dumps(cm)
        )
        db.add(baseline_eval)
        db.commit()
        print("Initialized baseline ModelEvaluation benchmark metrics.")

    # 4. Auto-Seed Benchmark Telemetry Events if empty
    from app.models.network_event import NetworkEvent
    from app.ingestion.processor import CSVProcessor

    event_count = db.query(NetworkEvent).count()
    if event_count == 0:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        root_dir = os.path.dirname(backend_dir)
        csv_path = os.path.join(root_dir, "data", "sample", "shadow_ai_events_synthetic.csv")

        if os.path.exists(csv_path):
            try:
                with open(csv_path, "rb") as f:
                    file_content = f.read()
                processor = CSVProcessor(db)
                result = processor.process_csv_content(
                    file_content=file_content,
                    file_name="shadow_ai_events_synthetic.csv",
                    source_type="demo",
                    is_synthetic=True
                )
                print(f"Auto-ingested {result.get('total_events', 0)} benchmark telemetry events into database.")
            except Exception as e:
                print(f"Notice: Failed to auto-ingest benchmark events: {e}")
