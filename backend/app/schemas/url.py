from datetime import datetime

from pydantic import BaseModel, HttpUrl, field_validator


class ShortenRequest(BaseModel):
    long_url:HttpUrl
    user_id : int | None = None

    @field_validator("long_url")
    @classmethod
    def validate_long_url(cls, value: HttpUrl):
        if value.scheme not in {"http", "https"}:
            raise ValueError("Only HTTP and HTTPS URLs are allowed")

        if value.username or value.password:
            raise ValueError("URLs containing credentials are not allowed")

        if len(str(value)) > 2048:
            raise ValueError("URL exceeds maximum allowed length")

        return value

class ShortenResponse(BaseModel):
    message: str
    short_code: str
    short_url: str


class UserURLResponse(BaseModel):
    short_code: str
    short_url: str
    long_url: HttpUrl
    total_clicks:int
    created_at: datetime
    expires_at : datetime | None = None
    is_expired : bool


class URLStatsResponse(BaseModel):
    short_code:str
    short_url:str
    total_clicks:int


class UpdateExpirationRequest(BaseModel):
    expires_at: datetime | None = None

class UpdateExpirationResponse(BaseModel):
    message: str
    expires_at: datetime | None