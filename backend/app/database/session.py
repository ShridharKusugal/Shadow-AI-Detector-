import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

def create_app_engine():
    # 1. Direct DATABASE_URL (for Render PostgreSQL, Neon, Supabase, TiDB, etc.)
    custom_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL
    if custom_url and custom_url.strip():
        db_url = custom_url.strip()
        # Render sets postgres:// by default; SQLAlchemy requires postgresql://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        if db_url.startswith("sqlite"):
            return create_engine(db_url, connect_args={"check_same_thread": False})
        return create_engine(db_url, pool_pre_ping=True, pool_recycle=1800)

    # 2. Try MySQL via connection settings
    if settings.DB_HOST:
        try:
            mysql_url = URL.create(
                drivername="mysql+pymysql",
                username=settings.DB_USER,
                password=settings.DB_PASSWORD,
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                database=settings.DB_NAME,
                query={"charset": "utf8mb4"}
            )
            candidate_engine = create_engine(
                mysql_url,
                pool_size=10,
                max_overflow=20,
                pool_recycle=1800,
                pool_pre_ping=True,
                echo=False
            )
            # Fast ping check to verify server is reachable
            with candidate_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return candidate_engine
        except Exception as e:
            print(f"[Database] Notice: MySQL unavailable ({e}). Falling back to SQLite.")

    # 3. Fallback to SQLite (ensures cloud deployment boots immediately even before external DB is attached)
    sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "shadow_ai_detector.db")
    return create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

engine = create_app_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency that yields a database session and safely closes it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
