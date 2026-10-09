from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=True)
    organization = Column(String(128), nullable=True)
    role = Column(String(32), index=True, default="analyst", nullable=False)  # admin, analyst, viewer
    account_status = Column(String(32), index=True, default="PENDING", nullable=False)  # PENDING, ACTIVE, REJECTED, DISABLED
    is_active = Column(Boolean, default=True, nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    assigned_alerts = relationship("Alert", back_populates="assigned_user")
    investigations = relationship("Investigation", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    approved_users = relationship("User", foreign_keys=[approved_by], backref="approver", remote_side=[id])

