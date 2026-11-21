from random import random
import secrets

from fastapi import Depends, FastAPI,status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl
from sqlmodel import Session, select

from app.utils.base62 import decode, encode

from app.core.config import settings
from app.core.database import get_session
from app.models.urls import URL

app = FastAPI()

print(settings.DATABASE_URL)

@app.get("/health")
def check_health():
    return {
        "status" : "OK",
        "message" : "Working"
    }

in_memory = {}

class ShortenRequest(BaseModel):
    long_url:HttpUrl

@app.post("/api/shorten", status_code=status.HTTP_201_CREATED)
def shorten_url(payload:ShortenRequest, session:Session = Depends(get_session)):
    # id = secrets.randbits(32)
    url = URL(
        long_url=str(payload.long_url)
    )

    session.add(url)
    session.flush()

    url.short_code = encode(url.id)

    session.add(url)
    session.commit()
    session.refresh(url)

    print(url)
    # code = encode(id)
    # in_memory[id] = request.long_url
    return {
        "message": "Success",
        "short_code":url.short_code,
        "shortURL" : f"{settings.BASE_URL}/{url.short_code}"
    }

from fastapi import HTTPException, status

@app.get("/{code}")
def retrieve(code: str, session:Session = Depends(get_session)):
    try:
        url_id = decode(code)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    url = session.exec(select(URL).where(URL.id == url_id)).first()

    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found"
        )

    # long_url = in_memory.get(id)

    # if long_url is None:
    #     raise HTTPException(
    #         status_code=status.HTTP_404_NOT_FOUND,
    #         detail="Short URL not found"
    #     )

    return RedirectResponse(url=str(url.long_url),status_code=status.HTTP_302_FOUND)

    # return {
    #     "id": id,
    #     "code": code,
    #     "long_url": str(long_url)
    # }