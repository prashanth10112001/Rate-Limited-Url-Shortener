from app.repositories.cache_repository import CacheRepository
from app.core.cache import redis_client

def get_cache_repository():
    return CacheRepository(redis_client=redis_client)