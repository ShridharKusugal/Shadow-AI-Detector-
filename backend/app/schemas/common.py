from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    account_status: str = "ACTIVE"
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    username: str = Field(..., description="Username or official email address")
    password: str = Field(..., min_length=1)
    remember_me: Optional[bool] = False

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=128, description="Analyst full legal name")
    email: EmailStr = Field(..., description="Official enterprise email address")
    username: str = Field(..., min_length=3, max_length=64, pattern="^[a-zA-Z0-9_.-]+$", description="Alphanumeric handle")
    password: str = Field(..., min_length=8, max_length=128, description="Secure analyst password")
    confirm_password: Optional[str] = None
    organization: Optional[str] = Field(default=None, max_length=128)
    invitation_code: Optional[str] = Field(default=None, max_length=64)
    accept_policy: bool = Field(default=True, description="Acceptance of enterprise cybersecurity and acceptable-use policies")

    @field_validator("username")
    @classmethod
    def normalize_username(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class UserRegisterResponse(BaseModel):
    status: str
    message: str
    user_id: int
    username: str
    email: str
    account_status: str

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    role: str
    account_status: str = "ACTIVE"
    is_active: bool
    created_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

class PendingAnalystItem(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    role: str
    account_status: str
    created_at: Optional[datetime] = None

class UserApprovalActionResponse(BaseModel):
    success: bool
    message: str
    user_id: int
    account_status: str

class PolicyUpdateRequest(BaseModel):
    approval_status: str = Field(..., pattern="^(approved|unapproved|requires_review)$")
    risk_weight: int = Field(..., ge=0, le=100)
    notes: Optional[str] = None

class InvestigationUpdateRequest(BaseModel):
    action_taken: str
    note: str
    new_status: Optional[str] = None
    assigned_username: Optional[str] = None

class MLPredictRequest(BaseModel):
    destination_domain: str
    bytes_out: int = Field(default=50000, ge=0)
    bytes_in: int = Field(default=150000, ge=0)
    connection_count: int = Field(default=5, ge=1)
    source_type: str = "corporate_proxy"
