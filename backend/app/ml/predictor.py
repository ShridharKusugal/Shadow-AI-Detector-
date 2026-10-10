import os
import warnings
import joblib
from typing import Dict, Any, Tuple, Optional

# Suppress feature name validation warnings during high-throughput inference loops
warnings.filterwarnings("ignore", category=UserWarning)


class MLPredictor:
    def __init__(self, model_path: Optional[str] = None):
        if not model_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            model_path = os.path.join(base_dir, "models", "shadow_ai_detector_rf.joblib")
        
        self.model_path = model_path
        self.model = None
        self.feature_cols = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                artifact = joblib.load(self.model_path)
                self.model = artifact["model"]
                self.feature_cols = artifact["feature_cols"]
                self.is_loaded = True
            except Exception as e:
                print(f"Warning: Could not load ML model from {self.model_path}: {e}")
                self.is_loaded = False

    def predict(self, features: Dict[str, Any]) -> Tuple[bool, float]:
        """
        Predict whether an event requires security review.
        Returns: (review_predicted: bool, confidence: float)
        """
        if not self.is_loaded or self.model is None:
            # Fallback to rules-based heuristic
            is_unapproved = features.get("is_unapproved", 0) == 1
            high_vol = features.get("high_outbound_anomaly", False)
            predicted = is_unapproved or high_vol
            confidence = 0.85 if predicted else 0.70
            return predicted, confidence

        try:
            # Prepare feature vector matching training order
            row = [
                float(features.get("outbound_mb", 0.0)),
                float(features.get("inbound_mb", 0.0)),
                float(features.get("connection_count", 1)),
                float(features.get("byte_ratio", 0.0)),
                float(features.get("domain_entropy", 0.0)),
                float(features.get("is_ai_service", 0)),
                float(features.get("risk_weight", 0))
            ]
            prob = float(self.model.predict_proba([row])[0][1])
            predicted = bool(prob >= 0.5)
            return predicted, round(prob, 4)
        except Exception:
            # Safe heuristic fallback
            return bool(features.get("is_unapproved", 0) == 1), 0.75

# Global predictor instance
ml_predictor = MLPredictor()
