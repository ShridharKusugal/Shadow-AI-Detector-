from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(128), nullable=False)
    model_version = Column(String(32), nullable=False)
    dataset_type = Column(String(64), default="synthetic_benchmark", nullable=False) # synthetic_benchmark, real_authorized
    train_samples = Column(Integer, nullable=False)
    test_samples = Column(Integer, nullable=False)
    metrics_json = Column(Text, nullable=False)
    feature_importance_json = Column(Text, nullable=True)
    confusion_matrix_json = Column(Text, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
