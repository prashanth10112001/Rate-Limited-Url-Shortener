from fastapi import Depends
from sqlmodel import Session

from app.dependencies.user_repository import get_user_repository
from app.repositories.user_repository import UserRepository
from app.models.user_model import User
from app.exceptions.auth_exceptions import UsernameAlreadyExists, EmailAlreadyExists, InvalidCredentials, InvalidToken
from app.utils.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self, repository: UserRepository = Depends(get_user_repository)):
        self.repository = repository

    def register_user(self, username:str, email:str, password:str) -> User:

        existing_user = self.repository.get_by_username(username=username)

        if existing_user:
            raise UsernameAlreadyExists()

        existing_email = self.repository.get_by_email(email=email)
        
        if existing_email:
            raise EmailAlreadyExists()

        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password)
        )

        created_user = self.repository.create_user(user)

        return created_user


    def login_user(self, username:str,password:str) -> str:

        user = self.repository.get_by_username(username=username)

        if not user or not verify_password(password,str(user.password_hash)):
            raise InvalidCredentials()

        return create_access_token(int(user.id))


        