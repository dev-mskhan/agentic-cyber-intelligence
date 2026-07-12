import redisClient from "../config/redis.js";

const DEFAULT_TTL_SECONDS = 60 * 60 * 6; // 6h short-lived cache for external API responses

export async function getCached<T>(key: string): Promise<T | null> {
  const raw = await redisClient.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL_SECONDS,
) {
  await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  await setCached(key, fresh, ttlSeconds);
  return fresh;
}
