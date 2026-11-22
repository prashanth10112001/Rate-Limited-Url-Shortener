from datetime import datetime, timezone

from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse

from app.schemas.url import ShortenRequest,ShortenResponse, URLClickPageResponse, URLClickResponse, URLStatsResponse, UpdateExpirationRequest, UpdateExpirationResponse, UserURLResponse
from app.services.url_service import URLService
from app.dependencies.url_service import get_url_service
from app.core.config import settings
from app.exceptions.url_exceptions import URLAccessDenied, URLCreationError, URLExpired,URLNotFound
from app.schemas.auth_schema import UserResponse
from app.dependencies.auth import get_current_user, get_optional_user
from app.models.user_model import User
from app.models.url_click_model import URLClick
from app.dependencies.analytics_service import get_analytics_service
from app.services.analytics_service import AnalyticsService
# from app.rate_limiters.token_bucket import TokenBucket, get_rate_limiter
from app.rate_limiters.redis_token_bucket import RedisTokenBucket, get_rate_limiter


url_controller = APIRouter(
    prefix="",tags=["URL_ROUTER"]
)

def frontend_error_redirect(request: Request, page: str) -> RedirectResponse | None:
    frontend_base_url = settings.FRONTEND_BASE_URL
    accepts_html = "text/html" in request.headers.get("accept", "").lower()
    if not frontend_base_url or not accepts_html:
        return None
    response = RedirectResponse(
        url=f"{frontend_base_url.rstrip('/')}/{page}",
        status_code=status.HTTP_302_FOUND,
    )
    response.headers["Vary"] = "Accept"
    return response

@url_controller.post("/api/shorten", response_model=ShortenResponse , status_code=status.HTTP_201_CREATED)
def shorten_url(
    request:Request,
    payload:ShortenRequest,
    url_service:URLService = Depends(get_url_service),
    current_user: User | None = Depends(get_optional_user),
    # rate_limiter:TokenBucket = Depends(get_rate_limiter)
    rate_limiter:RedisTokenBucket = Depends(get_rate_limiter)
    ):

    ip_address = request.client.host

    if not rate_limiter.allow_request(ip_address=ip_address):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )


    try:
        user_id = ( current_user.id if current_user else None )
        short_code = url_service.generate_short_url(long_url=str(payload.long_url),user_id=user_id)
        return ShortenResponse(
                message="Success",
                short_code=short_code,
                short_url=f"{settings.BASE_URL}/{short_code}"
            )
    except URLCreationError:
         raise HTTPException(
              status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
              detail="Unable to create shortened URL"
         )

@url_controller.get("/{code}",status_code=status.HTTP_302_FOUND)
def retrieve(
    code: str, 
    request:Request,
    background_tasks:BackgroundTasks,
    url_service:URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
    ):
    try:
        url = url_service.get_original_url(str(code))

        # analytics_service.record_the_click(
        #     url_id=url.id,
        #     ip_address=request.client.host,
        #     user_agent=request.headers.get("user-agent",""),
        #     referrer=request.headers.get("referer")
        # )

        background_tasks.add_task(
            analytics_service.record_the_click,
            url_id=url.id,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent",""),
            referrer=request.headers.get("referer")
        )

        return RedirectResponse(
            url=str(url.long_url),
            status_code=status.HTTP_302_FOUND
            )

    except URLNotFound:
        error_redirect = frontend_error_redirect(request, "url-not-found")
        if error_redirect:
            return error_redirect
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    except URLExpired:
        error_redirect = frontend_error_redirect(request, "url-expired")
        if error_redirect:
            return error_redirect
        raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="URL has expired"
        )



@url_controller.get("/api/my-urls", response_model=list[UserURLResponse])
def get_my_urls(
    current_user: User = Depends(get_current_user),
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    urls = url_service.get_user_urls(current_user.id)

    url_ids = [url.id for url in urls]

    click_counts = (analytics_service.get_click_counts(url_ids=url_ids))

    now = datetime.now(timezone.utc)

    return [  
        UserURLResponse(
            short_code=url.short_code,
            short_url=f"{settings.BASE_URL}/{url.short_code}",
            long_url=url.long_url,
            total_clicks=click_counts.get(url.id,0),
            created_at=url.created_at,
            expires_at=url.expires_at,
            is_expired=(url.expires_at is not None and now>=url.expires_at)
        ) for url in urls ]

@url_controller.get("/api/stats/{code}", response_model=URLStatsResponse)
def get_stats(
    code:str,
    current_user: User = Depends(get_current_user),
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):

    try:
        url = url_service.get_url(str(code))
    except URLNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    if url.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this url"
        )

    total_clicks, last_click_at, unique_visitors = (
        analytics_service.get_click_summary(url_id=url.id)
    )

    return URLStatsResponse(
        short_code=url.short_code,
        short_url=f"{settings.BASE_URL}/{url.short_code}",
        total_clicks=total_clicks,
        last_click_at=last_click_at,
        unique_visitors=unique_visitors,
    )

@url_controller.get(
    "/api/stats/{code}/clicks",
    response_model=URLClickPageResponse,
)
def get_url_clicks(
    code: str,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=200),
    sort_by: str = Query(default="clicked_at", min_length=1, max_length=64),
    sort_direction: Literal["asc", "desc"] = "desc",
    current_user: User = Depends(get_current_user),
    url_service: URLService = Depends(get_url_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    try:
        url = url_service.get_url(str(code))
    except URLNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found",
        )

    if url.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this url",
        )

    if sort_by not in URLClick.__table__.columns:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported click-record sort field",
        )

    clicks, total = analytics_service.get_clicks_by_url_id(
        url_id=url.id,
        limit=limit,
        offset=offset,
        search=search,
        sort_by=sort_by,
        sort_direction=sort_direction,
    )
    return URLClickPageResponse(
        items=[
            URLClickResponse(
                id=click.id,
                url_id=click.url_id,
                ip_address=click.ip_address,
                user_agent=click.user_agent,
                referrer=click.referrer,
                clicked_at=click.clicked_at,
            )
            for click in clicks
        ],
        total=total,
        limit=limit,
        offset=offset,
    )

@url_controller.delete("/api/urls/{code}", status_code=status.HTTP_200_OK)
def delete_url(
    code: str,
    current_user: User = Depends(get_current_user),
    url_service: URLService = Depends(get_url_service)
):
    try:
        url_service.delete_url(str(code),current_user_id=current_user.id)
        return {
            "message" : "URL deleted successfully"
        }
    except URLNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    except URLAccessDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this URL"
        )


@url_controller.patch("/api/urls/{code}/expiration",response_model=UpdateExpirationResponse)
def update_expiration(
    code : str,
    payload:UpdateExpirationRequest,
    current_user: User = Depends(get_current_user),
    url_service : URLService = Depends(get_url_service)
):
    try:
        url = url_service.update_expiration(
            code=str(code),
            current_user_id=current_user.id,
            expires_at=payload.expires_at
        )

        return UpdateExpirationResponse(
            message="Expiration Updated Successfully",
            expires_at=url.expires_at
        )

    except URLNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )
    except URLAccessDenied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this URL"
        )