from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("ai_providers.id", ondelete="CASCADE"), nullable=True, index=True)
    rule_name = Column(String(128), nullable=False)
    approval_status = Column(String(32), default="requires_review", nullable=False) # approved, unapproved, requires_review
    risk_weight = Column(Integer, default=50, nullable=False) # 0 to 100
    version = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)
    updated_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    provider = relationship("AIProvider", back_populates="policies")
    updated_by = relationship("User")
