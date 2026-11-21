from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

from app.schemas.url import ShortenRequest,ShortenResponse
from app.services.url_service import URLService
from app.dependencies.url_service import get_url_service
from app.core.config import settings
from app.exceptions.url_exceptions import URLCreationError,URLNotFound


url_controller = APIRouter(
    prefix="",tags=["URL_ROUTER"]
)

@url_controller.post("/api/shorten", response_model=ShortenResponse , status_code=status.HTTP_201_CREATED)
def shorten_url(payload:ShortenRequest, service:URLService = Depends(get_url_service)):
    try:
        short_code = service.generate_short_url(long_url=str(payload.long_url))
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
def retrieve(code: str, service:URLService = Depends(get_url_service)):
    try:
        url = service.get_original_url(str(code))

    except URLNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    return RedirectResponse(url=str(url.long_url),status_code=status.HTTP_302_FOUND)
    