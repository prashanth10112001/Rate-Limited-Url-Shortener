from datetime import datetime, timezone

from app.repositories.url_repository import URLRepository
from app.utils.base62 import decode, encode
from app.models.urls import URL
from app.exceptions.url_exceptions import URLNotFound,DuplicateShortCode,URLCreationError, URLAccessDenied, URLExpired
from app.repositories.cache_repository import CacheRepository


class URLService:
    
    MAX_RETRIES = 3

    def __init__(self, repository: URLRepository, cache_repository: CacheRepository):
        self.repository = repository
        self.cache_repository = cache_repository

    def get_url(self, code:str) -> URL:
        url_id = int(decode(str(code)))

        url = self.repository.get_by_url_id(url_id=url_id)

        if not url:
            raise URLNotFound()
        
        return url

    def generate_short_url(self, long_url: str, user_id : int | None = None) -> str:

        url = self.repository.create_url(long_url=long_url, user_id=user_id)

        for attempt in range(self.MAX_RETRIES):
            url.short_code = encode(url.id)

            try:
                self.repository.save_url(url)

                return url.short_code
            except DuplicateShortCode:
                if attempt == self.MAX_RETRIES-1:
                    raise URLCreationError("Unable to generate a unique short code")

            raise URLCreationError("URL creation failed")

    def get_original_url(self, short_code:str) -> URL:



        cached_url = self.cache_repository.get(short_code)

        if cached_url is not None:
            return URL(
                id=cached_url["id"],
                long_url=cached_url["long_url"],
                short_code=short_code
            )

        # url = self.get_url(code=short_code)
        url_id = int(decode(str(short_code)))
        url = self.repository.get_by_url_id(url_id=url_id)

        if not url:
            raise URLNotFound()

        now = datetime.now(timezone.utc)

        if (url.expires_at and now >= url.expires_at):
            raise URLExpired()

        ttl = 3600

        if url.expires_at:
            remaining_seconds = int((url.expires_at - now).total_seconds())
            ttl = min(ttl, remaining_seconds)

        if ttl > 0:
            self.cache_repository.set(
                key=short_code,
                value={
                    "id":url.id,
                    "long_url":str(url.long_url)
                },
                ttl=ttl
            )

        return url

    def get_user_urls(self, user_id:int) -> list[URL]:
        return self.repository.get_by_user_id(int(user_id))

    def delete_url(self, code:str,current_user_id:int) -> None:
        url = self.get_url(code=code)

        if url.user_id != current_user_id:
            raise URLAccessDenied()

        self.repository.delete_url(url)

        self.cache_repository.delete(code)

    def update_expiration(
            self,
            code:str,
            current_user_id:int,
            expires_at:datetime | None
    ) -> URL:
        url = self.get_url(code=code)

        if url.user_id != current_user_id:
            raise URLAccessDenied()

        url.expires_at = expires_at

        self.repository.save_url(url)
        self.cache_repository.delete(code)
        return url




