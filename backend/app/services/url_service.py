
from app.repositories.url_repository import URLRepository
from app.utils.base62 import decode, encode
from app.models.urls import URL
from app.exceptions.url_exceptions import URLNotFound,DuplicateShortCode,URLCreationError


class URLService:
    
    MAX_RETRIES = 3

    def __init__(self, repository: URLRepository):
        self.repository = repository

    def generate_short_url(self, long_url: str) -> str:

        url = self.repository.create_url(long_url=long_url)

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

        url_id = decode(str(short_code))
        url = self.repository.get_by_url_id(url_id=url_id)

        if not url:
            raise URLNotFound()

        return url



