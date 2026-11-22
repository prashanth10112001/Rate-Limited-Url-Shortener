from fastapi import Depends

from app.dependencies.url_repository import get_url_repository
from app.repositories.url_repository import URLRepository
from app.services.url_service import URLService
from app.repositories.cache_repository import CacheRepository
from app.dependencies.cache_repository import get_cache_repository


def get_url_service(
        repository: URLRepository = Depends(get_url_repository),
        cache_repository:CacheRepository = Depends(get_cache_repository)
):
    return URLService(repository=repository,cache_repository=cache_repository)