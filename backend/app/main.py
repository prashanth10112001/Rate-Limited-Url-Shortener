from fastapi import Depends, FastAPI

from app.controllers.url_controller import url_controller

app = FastAPI()

@app.get("/health")
def check_health():
    return {
        "status" : "OK",
        "message" : "Working"
    }

app.include_router(url_controller)
