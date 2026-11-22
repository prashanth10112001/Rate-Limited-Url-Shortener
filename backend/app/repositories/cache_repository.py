import json

from redis import Redis, RedisError


class CacheRepository:
    PREFIX = "url:"

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def get(self, key:str) -> dict | None:
        try:
            key = f"{self.PREFIX}{key}"

            data = self.redis.get(key)

            if not data:
                return None
            return json.loads(data)
        except (RedisError, json.JSONDecodeError):
            return None

    def set(self, key:str, value:dict, ttl:int):
        try:
            if(ttl>0):
                key = f"{self.PREFIX}{key}"
                self.redis.set(
                    name=key,
                    value=json.dumps(value),
                    ex=ttl
                )
        except RedisError:
            pass

    def delete(self, key:str):
        try:
            self.redis.delete(f"{self.PREFIX}{key}")
        except RedisError:
            pass
