import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.services.auth_service import require_role
from app.models.model_evaluation import ModelEvaluation
from app.models.user import User
from app.schemas.common import MLPredictRequest
from app.detection.domain_normalizer import normalize_domain
from app.detection.provider_matcher import ProviderMatcher
from app.detection.policy_evaluator import PolicyEvaluator
from app.detection.feature_extractor import extract_features
from app.ml.predictor import ml_predictor
from app.ml.train import run_ml_pipeline

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/status")
def get_ml_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    latest = db.query(ModelEvaluation).order_by(desc(ModelEvaluation.evaluated_at)).first()
    if not latest:
        return {"status": "uninitialized", "message": "Model not trained."}

    metrics = json.loads(latest.metrics_json) if latest.metrics_json else {}
    importances = json.loads(latest.feature_importance_json) if latest.feature_importance_json else {}
    cm = json.loads(latest.confusion_matrix_json) if latest.confusion_matrix_json else {}

    return {
        "status": "ready",
        "model_name": latest.model_name,
        "model_version": latest.model_version,
        "dataset_type": latest.dataset_type,
        "train_samples": latest.train_samples,
        "test_samples": latest.test_samples,
        "metrics": metrics,
        "feature_importance": importances,
        "confusion_matrix": cm,
        "evaluated_at": latest.evaluated_at.isoformat() if latest.evaluated_at else None,
        "disclaimer": "Metrics were generated via synthetic benchmark evaluation. Model provides probabilistic prioritization, not authoritative proof of misconduct."
    }

@router.post("/predict")
def predict_event(
    req: MLPredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst", "viewer"]))
):
    is_valid, norm_domain, err = normalize_domain(req.destination_domain)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid domain: {err}")

    matcher = ProviderMatcher(db)
    evaluator = PolicyEvaluator(db)

    match_res = matcher.match(norm_domain)
    policy_res = evaluator.evaluate(match_res)

    event_summary = {
        "bytes_out": req.bytes_out,
        "bytes_in": req.bytes_in,
        "connection_count": req.connection_count,
        "normalized_domain": norm_domain,
        "source_type": req.source_type
    }
    features = extract_features(event_summary, match_res, policy_res)
    review_predicted, confidence = ml_predictor.predict(features)

    return {
        "destination_domain": norm_domain,
        "matched_provider": match_res.get("provider_name"),
        "approval_status": policy_res.get("approval_status"),
        "review_predicted": review_predicted,
        "confidence": confidence,
        "classification": "Requires Security Review" if review_predicted else "Standard Activity",
        "features": features
    }

@router.post("/train")
def trigger_training(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    metadata = run_ml_pipeline()
    ml_predictor._load_model()  # Reload in memory
    return {"message": "Model training completed successfully", "metadata": metadata}
