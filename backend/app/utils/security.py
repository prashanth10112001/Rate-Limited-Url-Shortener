import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash

from app.core.config import settings


password_hash = PasswordHash.recommended()

# oauth2_scheme = OAuth2PasswordBearer(
#     tokenUrl="auth/token"
# )

def hash_password(password: str) -> str:
    return password_hash.hash(password=password)


def verify_password(plain_password:str, hashed_password:str) -> bool:
    return password_hash.verify(plain_password,hashed_password)


def create_access_token(user_id:int) -> str:

    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub" : str(user_id),
        "exp" : expire
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def decode_access_token(token : str)->str:
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# def get_token_payload(token:Annotated[str, Depends(oauth2_scheme)]) -> dict[str,any]:
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )

#     try:
#         payload = jwt.decode(
#             token,
#             settings.SECRET_KEY,
#             algorithms=[settings.ALGORITHM]
#         )

#         if not payload.get("sub"):
#             raise credentials_exception

#         return payload

#     except InvalidTokenError:
#         raise credentials_exception
