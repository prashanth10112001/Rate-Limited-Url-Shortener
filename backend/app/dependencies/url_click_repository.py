from fastapi import Depends
from sqlmodel import Session

from app.dependencies.database import get_session
from app.repositories.url_click_repository import URLClickRepository


def get_url_click_repository(session : Session = Depends(get_session)):
    return URLClickRepository(session=session)
