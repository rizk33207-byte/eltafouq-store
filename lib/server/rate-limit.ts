import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const ORDER_LIMIT = 12;
const ORDER_WINDOW_MS = 60_000;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashLimiter =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(ORDER_LIMIT, "1 m"),
        analytics: true,
        prefix: "eltafouk:orders",
      })
    : null;

const globalForRateLimit = globalThis as unknown as {
  orderRateLimitStore: Map<string, number[]> | undefined;
};

const inMemoryStore =
  globalForRateLimit.orderRateLimitStore ?? new Map<string, number[]>();

if (!globalForRateLimit.orderRateLimitStore) {
  globalForRateLimit.orderRateLimitStore = inMemoryStore;
}

const inMemoryRateLimit = (key: string): RateLimitResult => {
  const now = Date.now();
  const entries = inMemoryStore.get(key) ?? [];
  const activeEntries = entries.filter((timestamp) => now - timestamp < ORDER_WINDOW_MS);

  if (activeEntries.length >= ORDER_LIMIT) {
    const reset = activeEntries[0] + ORDER_WINDOW_MS;
    inMemoryStore.set(key, activeEntries);

    return {
      success: false,
      limit: ORDER_LIMIT,
      remaining: 0,
      reset,
    };
  }

  activeEntries.push(now);
  inMemoryStore.set(key, activeEntries);

  return {
    success: true,
    limit: ORDER_LIMIT,
    remaining: Math.max(0, ORDER_LIMIT - activeEntries.length),
    reset: now + ORDER_WINDOW_MS,
  };
};

export const rateLimitOrderCreate = async (
  key: string,
): Promise<RateLimitResult> => {
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(key);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  return inMemoryRateLimit(key);
};
