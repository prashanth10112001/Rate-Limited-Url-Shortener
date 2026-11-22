from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from app.schemas.url import ShortenRequest,ShortenResponse, URLStatsResponse, UpdateExpirationRequest, UpdateExpirationResponse, UserURLResponse
from app.services.url_service import URLService
from app.dependencies.url_service import get_url_service
from app.core.config import settings
from app.exceptions.url_exceptions import URLAccessDenied, URLCreationError, URLExpired,URLNotFound
from app.schemas.auth_schema import UserResponse
from app.dependencies.auth import get_current_user, get_optional_user
from app.models.user_model import User
from app.dependencies.analytics_service import get_analytics_service
from app.services.analytics_service import AnalyticsService
# from app.rate_limiters.token_bucket import TokenBucket, get_rate_limiter
from app.rate_limiters.redis_token_bucket import RedisTokenBucket, get_rate_limiter


url_controller = APIRouter(
    prefix="",tags=["URL_ROUTER"]
)

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    except URLExpired:
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

    total_clicks = analytics_service.get_click_count_by_url_id(url_id=url.id)

    return URLStatsResponse(
        short_code=url.short_code,
        short_url=f"{settings.BASE_URL}/{url.short_code}",
        total_clicks=total_clicks
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