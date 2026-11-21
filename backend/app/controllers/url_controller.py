from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from app.schemas.url import ShortenRequest,ShortenResponse, UserURLResponse
from app.services.url_service import URLService
from app.dependencies.url_service import get_url_service
from app.core.config import settings
from app.exceptions.url_exceptions import URLAccessDenied, URLCreationError,URLNotFound
from app.schemas.auth_schema import UserResponse
from app.dependencies.auth import get_current_user, get_optional_user
from app.models.user_model import User


url_controller = APIRouter(
    prefix="",tags=["URL_ROUTER"]
)

@url_controller.post("/api/shorten", response_model=ShortenResponse , status_code=status.HTTP_201_CREATED)
def shorten_url(
    payload:ShortenRequest,
    current_user: User | None = Depends(get_optional_user),
    url_service:URLService = Depends(get_url_service)):
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
def retrieve(code: str, url_service:URLService = Depends(get_url_service)):
    try:
        url = url_service.get_original_url(str(code))

    except URLNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    return RedirectResponse(url=str(url.long_url),status_code=status.HTTP_302_FOUND)


@url_controller.get("/api/my-urls", response_model=list[UserURLResponse])
def get_my_urls(
    current_user: User = Depends(get_current_user),
    url_service: URLService = Depends(get_url_service)
):
    urls = url_service.get_user_urls(current_user.id)

    return [  
        UserURLResponse(
            short_code=url.short_code,
            short_url=f"{settings.BASE_URL}/{url.short_code}",
            long_url=url.long_url,
            created_at=url.created_at
        ) for url in urls ]

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
    