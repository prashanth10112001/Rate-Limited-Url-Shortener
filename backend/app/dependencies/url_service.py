from fastapi import Depends

from app.dependencies.url_repository import get_url_repository
from app.repositories.url_repository import URLRepository
from app.services.url_service import URLService


def get_url_service(
        repository: URLRepository = Depends(get_url_repository)
):
    return URLService(repository=repository)