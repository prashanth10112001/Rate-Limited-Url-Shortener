from random import random
import secrets

from fastapi import FastAPI,status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl

from app.utils.base62 import decode, encode

app = FastAPI()

@app.get("/health")
def check_health():
    return {
        "status" : "OK",
        "message" : "Working"
    }

in_memory = {}

class ShortenRequest(BaseModel):
    long_url:HttpUrl

@app.post("/api/shorten")
def shorten_url(request:ShortenRequest):
    id = secrets.randbits(32)
    print("id ",id)
    code = encode(id)
    in_memory[id] = request.long_url
    return {
        "short_code":code,
        "shortURL" : f"http://localhost:8000/{code}"
    }

from fastapi import HTTPException, status

@app.get("/{code}")
def retrieve(code: str):
    try:
        id = decode(code)
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid short URL"
        )

    long_url = in_memory.get(id)

    if long_url is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Short URL not found"
        )

    return RedirectResponse(url=long_url,status_code=status.HTTP_302_FOUND)

    # return {
    #     "id": id,
    #     "code": code,
    #     "long_url": str(long_url)
    # }