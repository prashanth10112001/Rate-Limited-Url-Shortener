from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class URLClick(SQLModel, table = True):
    __tablename__ = "url_clicks"

    id: int | None = Field(default=None, primary_key=True)
    url_id: int = Field(foreign_key="urls.id", index=True)
    ip_address : str = Field(max_length=45)
    user_agent : str
    referrer : str | None = None
    clicked_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))