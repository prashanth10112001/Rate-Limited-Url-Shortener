from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel import Session

from app.controllers.url_controller import url_controller
from app.controllers.auth_controller import auth_controller
from app.core.cache import redis_client
from app.core.config import settings
from app.core.database import engine
from app.logging.logger import get_logger

app = FastAPI()
logger = get_logger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"Loaded CORS_ORIGINS: {settings.CORS_ORIGINS}")
@app.get("/health")
def check_health():
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
        redis_client.ping()
    except Exception:
        logger.exception("HEALTH CHECK FAILED")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Services are starting. Please try again shortly.",
        )

    return {
        "status": "OK",
        "message": "Working",
    }

app.include_router(url_controller)
app.include_router(auth_controller)
