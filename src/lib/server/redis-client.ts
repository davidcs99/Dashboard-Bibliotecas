import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error("Falta la variable de entorno REDIS_URL para conectarse a Redis.");
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: false
    });
  }

  return redisClient;
}
