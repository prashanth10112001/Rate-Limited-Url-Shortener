from fastapi import Depends
from sqlmodel import Session

from app.dependencies.database import get_session
from app.repositories.user_repository import UserRepository


def get_user_repository(session:Session = Depends(get_session)):
    return UserRepository(session)
