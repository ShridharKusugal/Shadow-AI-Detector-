import sys
import os
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.security import verify_password

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_registration_creates_persistent_pending_account(db):
    test_user = f"reg_test_{int(datetime.now(timezone.utc).timestamp())}"
    test_email = f"{test_user}@enterprise-defense.corp"

    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Dr. Sarah Connor",
            "email": test_email,
            "username": test_user,
            "password": "SecurePassword2026!",
            "confirm_password": "SecurePassword2026!",
            "organization": "Cyber Defense Grid",
            "accept_policy": True
        }
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "pending_approval"
    assert data["account_status"] == "PENDING"
    assert data["username"] == test_user

    # Verify persistent record in MySQL
    db_user = db.query(User).filter(User.username == test_user).first()
    assert db_user is not None
    assert db_user.account_status == "PENDING"
    assert db_user.role == "analyst"  # Public registration strictly defaults to analyst
    assert db_user.hashed_password != "SecurePassword2026!"
    assert verify_password("SecurePassword2026!", db_user.hashed_password) is True

def test_password_confirmation_mismatch():
    test_user = f"mismatch_{int(datetime.now(timezone.utc).timestamp())}"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Mismatch Tester",
            "email": f"{test_user}@defense.org",
            "username": test_user,
            "password": "PasswordOne2026!",
            "confirm_password": "PasswordTwo2026!",
            "accept_policy": True
        }
    )
    assert response.status_code == 400
    assert "Passwords do not match" in response.json()["detail"]

def test_duplicate_username_and_email_rejected(db):
    # First create a user
    test_user = f"dup_user_{int(datetime.now(timezone.utc).timestamp())}"
    test_email = f"{test_user}@defense.org"

    reg_first = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Original User",
            "email": test_email,
            "username": test_user,
            "password": "Password12345!",
            "confirm_password": "Password12345!",
            "accept_policy": True
        }
    )
    assert reg_first.status_code == 200

    # Attempt duplicate username
    res_dup_u = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Duplicate User",
            "email": f"diff_{test_email}",
            "username": test_user,
            "password": "Password12345!",
            "confirm_password": "Password12345!",
            "accept_policy": True
        }
    )
    assert res_dup_u.status_code == 400
    assert "Username is already in use" in res_dup_u.json()["detail"]

    # Attempt duplicate email
    res_dup_e = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Duplicate User",
            "email": test_email,
            "username": f"diff_{test_user}",
            "password": "Password12345!",
            "confirm_password": "Password12345!",
            "accept_policy": True
        }
    )
    assert res_dup_e.status_code == 400
    assert "Official email address is already registered" in res_dup_e.json()["detail"]

def test_pending_user_login_denied():
    test_user = f"pending_login_{int(datetime.now(timezone.utc).timestamp())}"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Pending Analyst",
            "email": f"{test_user}@defense.org",
            "username": test_user,
            "password": "PendingPass2026!",
            "confirm_password": "PendingPass2026!",
            "accept_policy": True
        }
    )
    assert reg_res.status_code == 200

    # Attempt login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": test_user, "password": "PendingPass2026!"}
    )
    assert login_res.status_code == 403
    assert "pending administrator approval" in login_res.json()["detail"].lower()

def test_wrong_password_rejected():
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "analyst", "password": "IncorrectPassword999!"}
    )
    assert res.status_code == 401
    assert "incorrect" in res.json()["detail"].lower()

def test_active_analyst_login_succeeds():
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "analyst", "password": "AnalystSecure2026!"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "analyst"
    assert data["account_status"] == "ACTIVE"

def test_admin_approval_lifecycle(db):
    # 1. Register candidate analyst
    candidate_user = f"candidate_{int(datetime.now(timezone.utc).timestamp())}"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Candidate Analyst",
            "email": f"{candidate_user}@secops.org",
            "username": candidate_user,
            "password": "CandidatePass2026!",
            "confirm_password": "CandidatePass2026!",
            "organization": "SOC Tier 2",
            "accept_policy": True
        }
    )
    assert reg_res.status_code == 200
    user_id = reg_res.json()["user_id"]

    # 2. Login as admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "AdminSecure2026!"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. List pending analysts
    pending_res = client.get("/api/v1/auth/admin/pending-analysts", headers=admin_headers)
    assert pending_res.status_code == 200
    pending_items = pending_res.json()
    assert any(item["username"] == candidate_user for item in pending_items)

    # 4. Approve candidate
    approve_res = client.post(f"/api/v1/auth/admin/approve-analyst/{user_id}", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["account_status"] == "ACTIVE"

    # 5. Now candidate can log in successfully
    candidate_login = client.post(
        "/api/v1/auth/login",
        json={"username": candidate_user, "password": "CandidatePass2026!"}
    )
    assert candidate_login.status_code == 200
    assert candidate_login.json()["account_status"] == "ACTIVE"

def test_non_admin_cannot_approve(db):
    # Login as normal analyst
    analyst_login = client.post(
        "/api/v1/auth/login",
        json={"username": "analyst", "password": "AnalystSecure2026!"}
    )
    analyst_token = analyst_login.json()["access_token"]
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # Attempt to list pending or approve
    res = client.get("/api/v1/auth/admin/pending-analysts", headers=analyst_headers)
    assert res.status_code == 403

def test_audit_logs_record_security_events(db):
    logs = db.query(AuditLog).filter(AuditLog.resource_type == "auth").all()
    actions = [l.action for l in logs]
    assert "login_success" in actions
