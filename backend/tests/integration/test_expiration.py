from datetime import datetime, timedelta, timezone

from app.core.config import settings


def register_user(client):
    client.post(
        "/auth/register",
        json={
            "username": "john",
            "email": "john@example.com",
            "password": "secret123"
        }
    )


def auth_headers(client):
    response = client.post(
        "/auth/login",
        json={
            "username": "john",
            "password": "secret123"
        }
    )

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


def test_expired_url_returns_410(client):
    register_user(client)
    headers = auth_headers(client)

    expired_time = (
        datetime.now(timezone.utc)
        - timedelta(minutes=1)
    ).isoformat()

    create_response = client.post(
        "/api/shorten",
        json={"long_url": "https://google.com"},
        headers=headers
    )
    code = create_response.json()["short_code"]

    update_response = client.patch(
        f"/api/urls/{code}/expiration",
        json={"expires_at": expired_time},
        headers=headers
    )
    assert update_response.status_code == 200

    redirect_response = client.get(
        f"/{code}",
        follow_redirects=False
    )

    assert redirect_response.status_code == 410
    assert redirect_response.json()["detail"] == "URL has expired"


def test_expired_url_redirects_to_frontend_for_browser(client, monkeypatch):
    register_user(client)
    headers = auth_headers(client)
    expired_time = (
        datetime.now(timezone.utc)
        - timedelta(minutes=1)
    ).isoformat()
    create_response = client.post(
        "/api/shorten",
        json={"long_url": "https://google.com"},
        headers=headers,
    )
    code = create_response.json()["short_code"]
    expiration_response = client.patch(
        f"/api/urls/{code}/expiration",
        json={"expires_at": expired_time},
        headers=headers,
    )
    assert expiration_response.status_code == 200
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")

    response = client.get(
        f"/{code}",
        headers={"Accept": "text/html"},
        follow_redirects=False,
    )

    assert response.status_code == 302
    assert response.headers["location"] == "http://localhost:5173/url-expired"


def test_future_expiration_still_redirects(client):
    register_user(client)
    headers = auth_headers(client)

    future_time = (
        datetime.now(timezone.utc)
        + timedelta(days=1)
    ).isoformat()

    create_response = client.post(
        "/api/shorten",
        json={"long_url": "https://google.com"},
        headers=headers
    )
    code = create_response.json()["short_code"]

    update_response = client.patch(
        f"/api/urls/{code}/expiration",
        json={"expires_at": future_time},
        headers=headers
    )
    assert update_response.status_code == 200

    redirect_response = client.get(
        f"/{code}",
        follow_redirects=False
    )

    assert redirect_response.status_code == 302


def test_url_without_expiration_redirects(client):

    response = client.post(
        "/api/shorten",
        json={
            "long_url": "https://google.com"
        }
    )

    code = response.json()["short_code"]

    redirect_response = client.get(
        f"/{code}",
        follow_redirects=False
    )

    assert redirect_response.status_code == 302


def test_owner_can_update_expiration(client):

    register_user(client)

    headers = auth_headers(client)

    create_response = client.post(
        "/api/shorten",
        json={
            "long_url": "https://google.com"
        },
        headers=headers
    )

    code = create_response.json()["short_code"]

    new_expiration = (
        datetime.now(timezone.utc)
        + timedelta(days=2)
    ).isoformat()

    response = client.patch(
        f"/api/urls/{code}/expiration",
        json={
            "expires_at": new_expiration
        },
        headers=headers
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Expiration Updated Successfully"
    )


def test_update_expiration_url_not_found(client):

    register_user(client)

    headers = auth_headers(client)

    response = client.patch(
        "/api/urls/abc123/expiration",
        json={
            "expires_at": (
                datetime.now(timezone.utc)
                + timedelta(days=1)
            ).isoformat()
        },
        headers=headers
    )

    assert response.status_code == 404


def test_non_owner_cannot_update_expiration(client):

    register_user(client)

    owner_headers = auth_headers(client)

    create_response = client.post(
        "/api/shorten",
        json={
            "long_url": "https://google.com"
        },
        headers=owner_headers
    )

    code = create_response.json()["short_code"]

    client.post(
        "/auth/register",
        json={
            "username": "alice",
            "email": "alice@example.com",
            "password": "secret123"
        }
    )

    alice_login = client.post(
        "/auth/login",
        json={
            "username": "alice",
            "password": "secret123"
        }
    )

    alice_headers = {
        "Authorization":
        f"Bearer {alice_login.json()['access_token']}"
    }

    response = client.patch(
        f"/api/urls/{code}/expiration",
        json={
            "expires_at": (
                datetime.now(timezone.utc)
                + timedelta(days=1)
            ).isoformat()
        },
        headers=alice_headers
    )

    assert response.status_code == 403