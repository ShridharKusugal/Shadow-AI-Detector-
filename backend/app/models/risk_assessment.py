from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("network_events.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("ai_providers.id", ondelete="SET NULL"), nullable=True, index=True)
    matched_domain = Column(String(255), nullable=True)
    match_type = Column(String(32), nullable=True)
    approval_status = Column(String(32), default="unknown", nullable=False) # approved, unapproved, requires_review, non_ai, unknown
    risk_score = Column(Integer, default=0, index=True, nullable=False) # 0 to 100
    severity = Column(String(32), index=True, default="low", nullable=False) # low, medium, high, critical
    detection_reasons_json = Column(Text, nullable=True)
    scoring_breakdown_json = Column(Text, nullable=True)
    missing_evidence_json = Column(Text, nullable=True)
    recommendations_json = Column(Text, nullable=True)
    ml_review_predicted = Column(Boolean, default=False, nullable=False)
    ml_confidence = Column(Float, default=0.0, nullable=False)
    policy_version = Column(Integer, default=1, nullable=False)
    assessed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    event = relationship("NetworkEvent", back_populates="risk_assessment")
    provider = relationship("AIProvider", back_populates="risk_assessments")
    alerts = relationship("Alert", back_populates="risk_assessment", cascade="all, delete-orphan")
