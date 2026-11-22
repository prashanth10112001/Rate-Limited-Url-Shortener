from app.core.config import settings
from sqlmodel import Session, create_engine


engine = create_engine(
    str(settings.DATABASE_URL),
    echo=True,
    pool_pre_ping=True,
    pool_recycle=1800
)




