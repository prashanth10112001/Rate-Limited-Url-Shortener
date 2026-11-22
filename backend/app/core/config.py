import os
from pathlib import Path

from pydantic import PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    BASE_URL: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    REDIS_URL: str
    RATE_LIMIT_CAPACITY: int
    RATE_LIMIT_REFILL_RATE: float

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return str(PostgresDsn.build(
            scheme="postgresql+psycopg2",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB
        ))


def get_settings() -> Settings:
    environment = os.getenv("APP_ENV","development")

    env_file = BASE_DIR / ( ".env.test" if environment == "test" else ".env" )

    return Settings(_env_file=env_file)

settings = get_settings()