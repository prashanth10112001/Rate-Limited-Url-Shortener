import app.rate_limiters.redis_token_bucket as redis_token_bucket
from app.core.config import settings


class FakeClock:
    def __init__(self):
        self.current_time = 100

    def time(self):
        return self.current_time

    def advance(self, seconds):
        self.current_time += seconds


def configure_rate_limiter(monkeypatch, capacity, refill_rate):
    monkeypatch.setattr(settings, "RATE_LIMIT_CAPACITY", capacity)
    monkeypatch.setattr(settings, "RATE_LIMIT_REFILL_RATE", refill_rate)
    clock = FakeClock()
    monkeypatch.setattr(redis_token_bucket, "time", clock)
    return clock


def test_requests_under_limit_succeed(client, monkeypatch):
    configure_rate_limiter(monkeypatch, capacity=5, refill_rate=0)

    for i in range(5):
        response = client.post(
            "/api/shorten",
            json={
                "long_url": f"https://example{i}.com"
            }
        )

        assert response.status_code == 201



def test_rate_limit_exceeded(client, monkeypatch):
    configure_rate_limiter(monkeypatch, capacity=5, refill_rate=0)

    for i in range(5):

        response = client.post(
            "/api/shorten",
            json={
                "long_url": f"https://example{i}.com"
            }
        )

        assert response.status_code == 201

    response = client.post(
        "/api/shorten",
        json={
            "long_url": "https://blocked.com"
        }
    )

    assert response.status_code == 429

    assert response.json()["detail"] == (
        "Rate limit exceeded. Please try again later."
    )


def test_rate_limit_counts_multiple_requests(client, monkeypatch):
    configure_rate_limiter(monkeypatch, capacity=5, refill_rate=0)

    success_count = 0

    for i in range(10):

        response = client.post(
            "/api/shorten",
            json={
                "long_url": f"https://example{i}.com"
            }
        )

        if response.status_code == 201:
            success_count += 1

    assert success_count == 5


def test_rate_limit_refills(client, monkeypatch):
    clock = configure_rate_limiter(
        monkeypatch,
        capacity=5,
        refill_rate=1,
    )

    for i in range(5):
        client.post(
            "/api/shorten",
            json={
                "long_url": f"https://example{i}.com"
            }
        )

    blocked = client.post(
        "/api/shorten",
        json={
            "long_url": "https://blocked.com"
        }
    )

    assert blocked.status_code == 429

    clock.advance(1)

    response = client.post(
        "/api/shorten",
        json={
            "long_url": "https://allowed-after-refill.com"
        }
    )

    assert response.status_code == 201