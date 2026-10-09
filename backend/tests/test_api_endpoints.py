import sys
import os
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "Shadow AI Detector Platform"

def test_login_and_auth_flow():
    # Login as admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "AdminSecure2026!"}
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "admin"
    token = token_data["access_token"]

    # Access protected profile
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "admin"

    # Access dashboard metrics
    metrics_res = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert "summary" in m_data
    assert "risk_distribution" in m_data

    # Access ML status
    ml_res = client.get("/api/v1/ml/status", headers=headers)
    assert ml_res.status_code == 200
    ml_data = ml_res.json()
    assert ml_data["status"] == "ready"
    assert "metrics" in ml_data
