import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.database.session import engine, SessionLocal
from app.database.base import Base
from app.database.init_db import init_db

# Import routers
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.ingestion import router as ingestion_router
from app.api.events import router as events_router
from app.api.catalog import router as catalog_router
from app.api.policy import router as policy_router
from app.api.alerts import router as alerts_router
from app.api.ml import router as ml_router
from app.api.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables and baseline seed exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title="Shadow AI Detector API",
    description="AI-Powered Cybersecurity Monitoring, Shadow AI Discovery and Risk Assessment Platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API v1 routers
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(ingestion_router, prefix=api_prefix)
app.include_router(events_router, prefix=api_prefix)
app.include_router(catalog_router, prefix=api_prefix)
app.include_router(policy_router, prefix=api_prefix)
app.include_router(alerts_router, prefix=api_prefix)
app.include_router(ml_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Shadow AI Detector Platform",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "docs": "/docs"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Safe error logging without leaking raw DB connection strings or passwords
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Check backend logs for diagnostics."}
    )
