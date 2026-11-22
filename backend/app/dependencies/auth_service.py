from fastapi import Depends

from app.repositories.user_repository import UserRepository
from app.dependencies.user_repository import get_user_repository
from app.services.auth_service import AuthService


def get_auth_service(repository:UserRepository = Depends(get_user_repository)):
    return AuthService(repository=repository)
