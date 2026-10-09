from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_uuid = Column(String(64), unique=True, index=True, nullable=False)
    event_id = Column(Integer, ForeignKey("network_events.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_assessment_id = Column(Integer, ForeignKey("risk_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(32), index=True, default="medium", nullable=False) # low, medium, high, critical
    risk_score = Column(Integer, index=True, default=0, nullable=False)
    status = Column(String(32), index=True, default="open", nullable=False) # open, in_review, confirmed_violation, false_positive, inconclusive, closed
    assigned_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    event = relationship("NetworkEvent", back_populates="alerts")
    risk_assessment = relationship("RiskAssessment", back_populates="alerts")
    assigned_user = relationship("User", back_populates="assigned_alerts")
    investigations = relationship("Investigation", back_populates="alert", cascade="all, delete-orphan")
