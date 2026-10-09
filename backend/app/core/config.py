import os
from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv

# Load from backend/.env if present, otherwise root .env
backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env")

if os.path.exists(backend_env):
    load_dotenv(backend_env)
elif os.path.exists(root_env):
    load_dotenv(root_env)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Shadow AI Detector"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = os.getenv("APP_ENV", "development")

    # MySQL connection configuration
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "shadow_ai_detector")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "shadow_ai_super_secret_jwt_key_2026_default_fallback_32_chars")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")

    # ML Model Configuration
    ML_MODEL_PATH: str = os.getenv("ML_MODEL_PATH", "models/shadow_ai_detector_rf.joblib")
    ML_METADATA_PATH: str = os.getenv("ML_METADATA_PATH", "models/model_metadata.json")

    # Ingestion Constraints
    MAX_CSV_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    MAX_CSV_ROWS: int = 100000

    model_config = {"case_sensitive": True}

settings = Settings()
