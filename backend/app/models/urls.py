from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class URL(SQLModel, table = True):

    id: int | None = Field(default=None, primary_key=True)
    short_code: str = Field(unique=True, index=True)
    long_url: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime | None = Field(default=None)