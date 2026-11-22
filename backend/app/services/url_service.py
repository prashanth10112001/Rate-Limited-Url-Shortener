from datetime import datetime, timezone

from app.repositories.url_repository import URLRepository
from app.utils.base62 import decode, encode
from app.models.urls import URL
from app.exceptions.url_exceptions import URLNotFound,DuplicateShortCode,URLCreationError, URLAccessDenied, URLExpired
from app.repositories.cache_repository import CacheRepository
from app.logging.logger import get_logger

logger = get_logger(__name__)


class URLService:
    
    MAX_RETRIES = 3

    def __init__(self, repository: URLRepository, cache_repository: CacheRepository):
        self.repository = repository
        self.cache_repository = cache_repository

    def get_url(self, code:str) -> URL:
        try:
            url_id = int(decode(str(code)))

            url = self.repository.get_by_url_id(url_id=url_id)

            if not url:
                logger.warning("URL NOT FOUND FOR SHORT CODE: %s", code)
                raise URLNotFound()
            
            return url
        except ValueError:
            logger.warning("INVALID BASE62 SHORT CODE: %s", code)
            raise URLNotFound()

    def generate_short_url(self, long_url: str, user_id : int | None = None) -> str:

        url = self.repository.create_url(long_url=long_url, user_id=user_id)

        for attempt in range(self.MAX_RETRIES):
            url.short_code = encode(url.id)

            try:
                self.repository.save_url(url)

                logger.info(
                    "SHORT URL CREATED SUCCESSFULLY | URL ID: %s",
                    url.id
                )

                return url.short_code
            except DuplicateShortCode:
                logger.warning(
                    "DUPLICATE SHORT CODE DETECTED. ATTEMPT: %s",
                    attempt + 1
                )
                if attempt == self.MAX_RETRIES-1:
                    logger.exception("MAXIMUM SHORT CODE GENERATION RETRIES REACHED")
                    raise URLCreationError("Unable to generate a unique short code")

            logger.error("URL CREATION FAILED")
            raise URLCreationError("URL creation failed")

    def get_original_url(self, short_code:str) -> URL:



        cached_url = self.cache_repository.get(short_code)

        if cached_url is not None:
            logger.info("CACHE HIT FOR SHORT CODE: %s", short_code)

            return URL(
                id=cached_url["id"],
                long_url=cached_url["long_url"],
                short_code=short_code
            )
        logger.info("CACHE MISS FOR SHORT CODE: %s", short_code)
        # url = self.get_url(code=short_code)
        try:
            url_id = int(decode(str(short_code)))
        except ValueError:
            logger.warning("INVALID BASE62 SHORT CODE: %s", short_code)
            raise URLNotFound()

        
        
        url = self.repository.get_by_url_id(url_id=url_id)

        if not url:
            logger.warning("URL NOT FOUND FOR SHORT CODE: %s", short_code)
            raise URLNotFound()

        now = datetime.now(timezone.utc)

        if (url.expires_at and now >= url.expires_at):
            logger.warning("URL EXPIRED FOR SHORT CODE: %s", short_code)
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

        logger.info("URL RETRIEVED SUCCESSFULLY. SHORT CODE: %s", short_code)

        return url

    def get_user_urls(self, user_id:int) -> list[URL]:
        try:
            urls =  self.repository.get_by_user_id(int(user_id))

            logger.info(
                "USER URLS RETRIEVED SUCCESSFULLY | USER ID: %s",
                user_id
            )

            return urls
        except Exception:
            logger.exception("FAILED TO RETRIEVE URLS FOR USER ID: %s", user_id)
            raise

    def delete_url(self, code:str,current_user_id:int) -> None:
        url = self.get_url(code=code)

        if url.user_id != current_user_id:
            logger.warning("UNAUTHORIZED URL DELETION ATTEMPT")
            raise URLAccessDenied()

        self.repository.delete_url(url)
        self.cache_repository.delete(code)

        logger.info("URL DELETED SUCCESSFULLY | SHORT CODE: %s", code)

    def update_expiration(
            self,
            code:str,
            current_user_id:int,
            expires_at:datetime | None
    ) -> URL:
        url = self.get_url(code=code)

        if url.user_id != current_user_id:
            logger.warning("UNAUTHORIZED URL EXPIRATION UPDATE ATTEMPT")
            raise URLAccessDenied()

        url.expires_at = expires_at

        self.repository.save_url(url)
        self.cache_repository.delete(code)
        logger.info("URL EXPIRATION UPDATED SUCCESSFULLY | SHORT CODE: %s", code)

        return url




