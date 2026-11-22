from fastapi import Depends
from sqlmodel import Session

from app.dependencies.database import get_session
from app.repositories.url_repository import URLRepository


def get_url_repository(session: Session = Depends(get_session)):
    return URLRepository(session)