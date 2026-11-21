from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError

from app.dependencies.user_repository import get_user_repository
from app.repositories.user_repository import UserRepository
from app.models.user_model import User
from app.utils.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token"
)

optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    auto_error=False
)


def get_current_user(
        token:str = Depends(oauth2_scheme),
        repository: UserRepository= Depends(get_user_repository)
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )

    try:
        payload = decode_access_token(token)

        user_id = int(payload.get("sub"))

        if user_id is None :
            raise credentials_exception

    except InvalidTokenError:
        raise credentials_exception

    user = repository.get_by_user_id(user_id)

    if user is None:
        raise credentials_exception

    return user


def get_optional_user(
        token:str | None = Depends(optional_oauth2_scheme),
        repository: UserRepository= Depends(get_user_repository)
) -> User | None:

    if not token:
        return None


    try:
        payload = decode_access_token(token)

        user_id = int(payload.get("sub"))

        if user_id is None :
            return None

    except InvalidTokenError:
        return None

    user = repository.get_by_user_id(user_id)

    return user
    