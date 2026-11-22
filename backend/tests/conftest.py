import os

os.environ["APP_ENV"] = "test"
import pytest

from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlmodel import Session,SQLModel
from app.models.url_click_model import URLClick
from app.models.urls import URL
from app.models.user_model import User


# LOAD TEST ENVIRONMENT BEFORE APPLICATION IMPORTS
load_dotenv(".env.test", override=True)

from app.main import app
from app.core.config import settings
from app.dependencies.database import get_session
from app.core.cache import redis_client


# DATABASE CONFIGURATION
database_name = make_url(settings.DATABASE_URL).database

if not database_name or "test" not in database_name.lower():
    raise RuntimeError(
        "REFUSING TO RUN TESTS: DATABASE NAME MUST CONTAIN 'TEST'"
    )

test_engine = create_engine(
    settings.DATABASE_URL,
    echo=False
)

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    SQLModel.metadata.create_all(test_engine)

    yield

    SQLModel.metadata.drop_all(test_engine)


# DATABASE DEPENDENCY OVERRIDE
def override_get_session():
    with Session(test_engine) as session:
        yield session


app.dependency_overrides[get_session] = override_get_session


# TEST CLIENT
@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# DATABASE CLEANUP
@pytest.fixture(autouse=True)
def clean_database():

    with Session(test_engine) as session:
        session.exec(
            text(
                "TRUNCATE TABLE "
                "url_clicks, urls, users "
                "RESTART IDENTITY CASCADE"
            )
        )
        session.commit()

    yield

    with Session(test_engine) as session:
        session.exec(
            text(
                "TRUNCATE TABLE "
                "url_clicks, urls, users "
                "RESTART IDENTITY CASCADE"
            )
        )
        session.commit()


# REDIS CLEANUP
@pytest.fixture(autouse=True)
def clean_redis():

    redis_client.flushdb()

    yield

    redis_client.flushdb()


# DATABASE SESSION
@pytest.fixture
def db_session():
    with Session(test_engine) as session:
        yield session


# CLEANUP AFTER ALL TESTS
def teardown_module():
    app.dependency_overrides.clear()
    test_engine.dispose()
