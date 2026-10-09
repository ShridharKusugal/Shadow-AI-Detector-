from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class ProviderDomain(Base):
    __tablename__ = "provider_domains"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("ai_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    domain_pattern = Column(String(255), index=True, nullable=False)
    match_type = Column(String(32), default="exact", nullable=False) # exact, subdomain, wildcard
    is_ai_service = Column(Boolean, default=True, nullable=False)
    source_reference = Column(String(255), default="Curated Catalog", nullable=False)
    verification_status = Column(String(32), default="verified", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    provider = relationship("AIProvider", back_populates="domains")
