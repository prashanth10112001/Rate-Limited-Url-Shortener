from fastapi import Depends
from sqlmodel import Session

from app.dependencies.user_repository import get_user_repository
from app.repositories.user_repository import UserRepository
from app.models.user_model import User
from app.exceptions.auth_exceptions import UsernameAlreadyExists, EmailAlreadyExists, InvalidCredentials, InvalidToken
from app.utils.security import create_access_token, hash_password, verify_password
from app.logging.logger import get_logger

logger = get_logger(__name__)


class AuthService:
    def __init__(self, repository: UserRepository = Depends(get_user_repository)):
        self.repository = repository

    def register_user(self, username:str, email:str, password:str) -> User:

        existing_user = self.repository.get_by_username(username=username)

        if existing_user:
            logger.warning("REGISTRATION FAILED: USERNAME ALREADY EXISTS")
            raise UsernameAlreadyExists()

        existing_email = self.repository.get_by_email(email=email)
        
        if existing_email:
            logger.warning("REGISTRATION FAILED: EMAIL ALREADY EXISTS")
            raise EmailAlreadyExists()
        try:
            user = User(
                username=username,
                email=email,
                password_hash=hash_password(password)
            )

            created_user = self.repository.create_user(user)

            logger.info(
                    "USER REGISTERED SUCCESSFULLY | USER ID: %s",
                    created_user.id
                )

            return created_user
        except Exception:
            logger.exception("UNEXPECTED ERROR DURING USER REGISTRATION")
            raise


    def login_user(self, username:str,password:str) -> str:

        user = self.repository.get_by_username(username=username)

        if not user or not verify_password(password,str(user.password_hash)):
            logger.warning("LOGIN FAILED: INVALID CREDENTIALS")
            raise InvalidCredentials()

        access_token = create_access_token(int(user.id))

        logger.info("USER LOGIN SUCCESSFUL | USER ID: %s", user.id)

        return access_token


        