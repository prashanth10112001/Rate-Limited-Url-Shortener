from app.core.cache import redis_client


def test_health_check_reports_ready_services(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "OK", "message": "Working"}


def test_health_check_allows_configured_frontend_origin(client):
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_health_check_returns_unavailable_when_redis_is_down(client, monkeypatch):
    def raise_connection_error():
        raise ConnectionError("Redis unavailable")

    monkeypatch.setattr(redis_client, "ping", raise_connection_error)

    response = client.get("/health")

    assert response.status_code == 503
    assert response.json()["detail"] == "Services are starting. Please try again shortly."
