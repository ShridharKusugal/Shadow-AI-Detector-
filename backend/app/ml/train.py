"""
Machine Learning Training & Evaluation Pipeline for Shadow AI Detector.
Trains Random Forest and Logistic Regression classifiers on engineered features.
Evaluates precision, recall, f1-score, confusion matrix, and false-positive rate.
Saves model artifacts via joblib and logs metrics to MySQL and models/model_metadata.json.
"""

import os
import sys
import json
import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score, confusion_matrix,
    classification_report, accuracy_score
)

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.session import SessionLocal
from app.models.model_evaluation import ModelEvaluation

def run_ml_pipeline():
    print("=" * 60)
    print("STARTING SHADOW AI DETECTOR ML BENCHMARK TRAINING PIPELINE")
    print("=" * 60)

    root_dir = os.path.dirname(backend_dir)
    data_path = os.path.join(root_dir, "data", "sample", "shadow_ai_events_synthetic.csv")
    models_dir = os.path.join(root_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training data not found at {data_path}. Run generate_datasets.py first.")

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records from {data_path}")

    # Feature Engineering
    df["byte_ratio"] = df["bytes_out"] / (df["bytes_in"] + 1.0)
    df["outbound_mb"] = df["bytes_out"] / (1024.0 * 1024.0)
    df["inbound_mb"] = df["bytes_in"] / (1024.0 * 1024.0)

    # Shannon entropy of destination domain
    def calc_entropy(s):
        if not isinstance(s, str) or not s:
            return 0.0
        prob = [float(s.count(c)) / len(s) for c in dict.fromkeys(list(s))]
        return -sum([p * np.log2(p) for p in prob if p > 0])

    df["domain_entropy"] = df["destination_domain"].apply(calc_entropy)
    df["is_ai_service"] = df["expected_provider_match"].apply(lambda p: 0 if "None" in str(p) or "Unknown" in str(p) else 1)

    # Numerical proxy for policy risk weight (0 to 100)
    status_weights = {
        "unapproved": 80,
        "requires_review": 45,
        "approved": 15,
        "non_ai": 0,
        "unknown": 30
    }
    df["policy_risk_weight"] = df["expected_approval_status"].map(status_weights).fillna(30)

    # Prediction target: 1 = activity requiring security review, 0 = benign/approved activity
    df["target"] = (df["expected_review_label"] == "requires_security_review").astype(int)

    feature_cols = [
        "outbound_mb",
        "inbound_mb",
        "connection_count",
        "byte_ratio",
        "domain_entropy",
        "is_ai_service",
        "policy_risk_weight"
    ]

    X = df[feature_cols]
    y = df["target"]

    print("Target distribution:")
    print(y.value_counts().to_dict())

    # Reproducible Train/Test split (75/25) with fixed seed=42
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"Train sample count: {len(X_train)}, Test sample count: {len(X_test)}")

    # Feature Scaling for comparison model
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Primary Model: Random Forest Classifier
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42
    )
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)
    y_prob_rf = rf_model.predict_proba(X_test)[:, 1]

    # Metrics for Random Forest
    acc_rf = accuracy_score(y_test, y_pred_rf)
    prec_rf = precision_score(y_test, y_pred_rf)
    rec_rf = recall_score(y_test, y_pred_rf)
    f1_rf = f1_score(y_test, y_pred_rf)
    cm_rf = confusion_matrix(y_test, y_pred_rf)
    
    # Calculate False Positive Rate: FP / (FP + TN)
    tn_rf, fp_rf, fn_rf, tp_rf = cm_rf.ravel()
    fpr_rf = float(fp_rf / (fp_rf + tn_rf)) if (fp_rf + tn_rf) > 0 else 0.0

    # Feature Importances
    importances = dict(zip(feature_cols, [round(float(v), 4) for v in rf_model.feature_importances_]))

    print("\n--- RANDOM FOREST EVALUATION RESULTS ---")
    print(f"Accuracy:  {acc_rf:.4f}")
    print(f"Precision: {prec_rf:.4f}")
    print(f"Recall:    {rec_rf:.4f}")
    print(f"F1-Score:  {f1_rf:.4f}")
    print(f"False Positive Rate: {fpr_rf:.4f}")
    print("Confusion Matrix [[TN, FP], [FN, TP]]:")
    print(cm_rf)

    # 2. Comparative Model: Logistic Regression
    lr_model = LogisticRegression(random_state=42, max_iter=500)
    lr_model.fit(X_train_scaled, y_train)
    y_pred_lr = lr_model.predict(X_test_scaled)

    prec_lr = precision_score(y_test, y_pred_lr)
    rec_lr = recall_score(y_test, y_pred_lr)
    f1_lr = f1_score(y_test, y_pred_lr)
    cm_lr = confusion_matrix(y_test, y_pred_lr)
    tn_lr, fp_lr, fn_lr, tp_lr = cm_lr.ravel()
    fpr_lr = float(fp_lr / (fp_lr + tn_lr)) if (fp_lr + tn_lr) > 0 else 0.0

    print("\n--- LOGISTIC REGRESSION (COMPARISON) ---")
    print(f"Precision: {prec_lr:.4f}, Recall: {rec_lr:.4f}, F1: {f1_lr:.4f}, FPR: {fpr_lr:.4f}")

    # Save fitted model artifacts
    model_artifact = {
        "model": rf_model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "version": "1.0.0",
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    model_save_path = os.path.join(models_dir, "shadow_ai_detector_rf.joblib")
    joblib.dump(model_artifact, model_save_path)
    print(f"\nModel artifact saved to: {model_save_path}")

    # Metadata record
    eval_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    metadata = {
        "model_name": "Shadow AI Classifier (Random Forest)",
        "model_version": "1.0.0",
        "dataset_type": "synthetic_benchmark",
        "dataset_path": "data/sample/shadow_ai_events_synthetic.csv",
        "target_definition": "1 = Activity requiring security review, 0 = Benign/approved activity",
        "random_seed": 42,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_columns": feature_cols,
        "primary_model_metrics": {
            "model": "RandomForestClassifier",
            "accuracy": round(acc_rf, 4),
            "precision": round(prec_rf, 4),
            "recall": round(rec_rf, 4),
            "f1_score": round(f1_rf, 4),
            "false_positive_rate": round(fpr_rf, 4),
            "confusion_matrix": {
                "true_negative": int(tn_rf),
                "false_positive": int(fp_rf),
                "false_negative": int(fn_rf),
                "true_positive": int(tp_rf)
            }
        },
        "comparison_model_metrics": {
            "model": "LogisticRegression",
            "precision": round(prec_lr, 4),
            "recall": round(rec_lr, 4),
            "f1_score": round(f1_lr, 4),
            "false_positive_rate": round(fpr_lr, 4),
            "confusion_matrix": {
                "true_negative": int(tn_lr),
                "false_positive": int(fp_lr),
                "false_negative": int(fn_lr),
                "true_positive": int(tp_lr)
            }
        },
        "feature_importance": importances,
        "evaluated_at": eval_timestamp,
        "critical_disclaimer": "These metrics are obtained on a reproducible synthetic benchmark dataset. They do NOT represent validated accuracy in an unconstrained enterprise network."
    }

    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved evaluation metadata to: {metadata_path}")

    # Save to MySQL database table model_evaluations
    db = SessionLocal()
    try:
        eval_record = ModelEvaluation(
            model_name="Shadow AI Classifier (Random Forest)",
            model_version="1.0.0",
            dataset_type="synthetic_benchmark",
            train_samples=len(X_train),
            test_samples=len(X_test),
            metrics_json=json.dumps(metadata["primary_model_metrics"]),
            feature_importance_json=json.dumps(importances),
            confusion_matrix_json=json.dumps(metadata["primary_model_metrics"]["confusion_matrix"])
        )
        db.add(eval_record)
        db.commit()
        print(f"Persisted ModelEvaluation record to MySQL (ID: {eval_record.id})")
    finally:
        db.close()

    print("=" * 60)
    print("ML PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 60)
    return metadata

if __name__ == "__main__":
    run_ml_pipeline()
