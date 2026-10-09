import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    raw_pass = "SecureAnalystPassword123!"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation_and_validation():
    username = "test_analyst"
    role = "analyst"
    token = create_access_token(username, role)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == username
    assert decoded["role"] == role
