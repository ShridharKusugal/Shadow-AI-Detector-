from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, index=True, nullable=False)
    slug = Column(String(64), unique=True, index=True, nullable=False)
    category = Column(String(128), default="Generative AI", nullable=False)
    description = Column(Text, nullable=True)
    risk_default = Column(String(32), default="medium", nullable=False) # low, medium, high, critical
    verification_status = Column(String(32), default="verified", nullable=False) # verified, unverified, community
    verification_date = Column(String(32), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    domains = relationship("ProviderDomain", back_populates="provider", cascade="all, delete-orphan")
    policies = relationship("PolicyRule", back_populates="provider", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="provider")
