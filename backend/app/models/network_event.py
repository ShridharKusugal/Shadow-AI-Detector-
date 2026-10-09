from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class NetworkEvent(Base):
    __tablename__ = "network_events"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("ingestion_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    event_uuid = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    device_id = Column(String(64), index=True, nullable=False)
    destination_domain = Column(String(255), index=True, nullable=False)
    normalized_domain = Column(String(255), index=True, nullable=False)
    connection_count = Column(Integer, default=1, nullable=False)
    bytes_out = Column(BigInteger, default=0, nullable=False)
    bytes_in = Column(BigInteger, default=0, nullable=False)
    protocol = Column(String(32), default="HTTPS", nullable=False)
    port = Column(Integer, default=443, nullable=False)
    source_type = Column(String(64), default="corporate_proxy", nullable=False)
    user_agent = Column(String(255), nullable=True)
    is_synthetic = Column(Boolean, default=False, nullable=False)
    raw_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    batch = relationship("IngestionBatch", back_populates="network_events")
    risk_assessment = relationship("RiskAssessment", back_populates="event", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="event", cascade="all, delete-orphan")
