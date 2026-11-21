from fastapi import Depends

from app.dependencies.url_click_repository import get_url_click_repository
from app.repositories.url_click_repository import URLClickRepository
from app.services.analytics_service import AnalyticsService


def get_analytics_service(repository : URLClickRepository = Depends(get_url_click_repository)):
    return AnalyticsService(repository=repository)