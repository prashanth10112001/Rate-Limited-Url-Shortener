from sqlmodel import Session

from app.repositories.url_click_repository import URLClickRepository

class AnalyticsService:
    def __init__(self, repository : URLClickRepository):
        self.repository = repository

    def record_the_click(
            self,
            url_id:int,
            ip_address:str,
            user_agent:str,
            referrer:str | None = None
    ) -> None:
        try:
            self.repository.create_click(
                url_id=url_id,
                ip_address=ip_address,
                user_agent=user_agent,
                referrer=referrer
            )

        except Exception:
            raise

    def get_click_count_by_url_id(self, url_id:int) -> int:
        return self.repository.get_click_count_by_url_id(int(url_id))

    def get_click_counts(
                self,
                url_ids:list[int]
        ) -> dict[int,int]:
        return self.repository.get_multiple_click_counts_by_url_id(url_ids=url_ids)
        