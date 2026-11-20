from fastapi import FastAPI

from app.utils.base62 import decode, encode

app = FastAPI()

@app.get("/health")
def check_health():
    return {
        "status" : "OK",
        "message" : "Working"
    }

@app.post("/api/shorten")
def shorten_url():
    code = encode(1)
    return {
        "short_code":code,
        "shortURL" : f"http://localhost:8000/{code}"
    }

@app.get("/{code}")
def retrieve(code:str):
    id = decode(code)
    return {
        "id":id,
        "code":code,
        "long_url":"https://google.com"
    }