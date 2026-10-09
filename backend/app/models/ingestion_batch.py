from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class IngestionBatch(Base):
    __tablename__ = "ingestion_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_uuid = Column(String(64), unique=True, index=True, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_hash = Column(String(64), index=True, nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    valid_count = Column(Integer, default=0, nullable=False)
    invalid_count = Column(Integer, default=0, nullable=False)
    duplicate_count = Column(Integer, default=0, nullable=False)
    source_type = Column(String(64), default="production_upload", nullable=False) # synthetic, production_upload, demo
    status = Column(String(32), default="processing", nullable=False) # processing, completed, failed
    validation_report_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    network_events = relationship("NetworkEvent", back_populates="batch", cascade="all, delete-orphan")
