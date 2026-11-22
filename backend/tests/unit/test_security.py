import pytest
import jwt

from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.core.config import settings


class TestPasswordSecurity:

    def test_hash_password(self):
        password = "secret123"

        hashed_password = hash_password(password)

        assert hashed_password != password
        assert isinstance(hashed_password, str)

    def test_verify_password_success(self):
        password = "secret123"

        hashed_password = hash_password(password)

        assert verify_password(password, hashed_password) is True

    def test_verify_password_failure(self):
        password = "secret123"

        hashed_password = hash_password(password)

        assert verify_password("wrongpassword", hashed_password) is False

    def test_different_passwords_have_different_hashes(self):
        password1 = "secret123"
        password2 = "secret456"

        hash1 = hash_password(password1)
        hash2 = hash_password(password2)

        assert hash1 != hash2


class TestJWTToken:

    def test_create_access_token(self):
        user_id = 1

        token = create_access_token(user_id)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token(self):
        user_id = 1

        token = create_access_token(user_id)

        payload = decode_access_token(token)

        assert payload["sub"] == str(user_id)
        assert "exp" in payload

    def test_token_expiration(self):
        user_id = 1

        token = create_access_token(user_id)

        payload = decode_access_token(token)

        expiration = datetime.fromtimestamp(
            payload["exp"],
            tz=timezone.utc
        )

        assert expiration > datetime.now(timezone.utc)

    def test_invalid_token(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token("invalid.token.value")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Could not validate credentials"

    def test_expired_token(self):
        expired_time = datetime.now(timezone.utc) - timedelta(minutes=5)

        payload = {
            "sub": "1",
            "exp": expired_time
        }

        token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(token)

        assert exc_info.value.status_code == 401

    def test_token_with_wrong_secret(self):
        token = jwt.encode(
            {
                "sub": "1",
                "exp": datetime.now(timezone.utc) + timedelta(minutes=10)
            },
            "wrong-secret-key-for-testing",
            algorithm=settings.ALGORITHM
        )

        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(token)

        assert exc_info.value.status_code == 401
