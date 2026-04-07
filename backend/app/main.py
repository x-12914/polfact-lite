"""
PolFact Lite - Main Application Entry Point
Runs without Docker, Celery, Redis, or PostgreSQL.
Uses SQLite for database and FastAPI BackgroundTasks for async jobs.
"""
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.api import api_router
from app.core.config import settings
from app.db.session import engine, Base
import app.models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Auto-create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
cors_origins = [str(o) for o in settings.BACKEND_CORS_ORIGINS] if settings.BACKEND_CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check
@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "mode": "lite"}

# Serve uploaded files as static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount(f"/{settings.UPLOAD_DIR}", StaticFiles(directory=settings.UPLOAD_DIR), name=settings.UPLOAD_DIR)

@app.on_event("startup")
async def startup_event():
    """Seed a default admin user if none exists."""
    from app.db.session import SessionLocal
    from app.services import user as user_service
    from app.schemas.user import UserCreate
    from app.models.user import UserRole

    db = SessionLocal()
    try:
        existing = user_service.get_user_by_email(db, email=settings.FIRST_SUPERUSER)
        if not existing:
            admin = UserCreate(
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                name="Admin",
                role=UserRole.ADMIN
            )
            user_service.create_user(db, obj_in=admin)
            logger.info(f"Created default admin: {settings.FIRST_SUPERUSER}")
    finally:
        db.close()
