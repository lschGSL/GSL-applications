import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// ---------------------------------------------------------------------------
// In-memory fallback (used when Upstash env vars are not set, e.g. dev/local).
// Keeps the previous behaviour so the rate limiter never silently disappears.
// ---------------------------------------------------------------------------
const memoryStore = new Map<string, { count: number; resetAt: number }>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore) {
      if (value.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60_000);
}

function checkMemoryRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterSeconds: 0,
  };
}

// ---------------------------------------------------------------------------
// Upstash-backed limiter (used when both env vars are present).
// ---------------------------------------------------------------------------
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const upstashEnabled = Boolean(upstashUrl && upstashToken);

const redis = upstashEnabled
  ? new Redis({ url: upstashUrl!, token: upstashToken! })
  : null;

// One Ratelimit instance per (maxAttempts, windowMs) tuple, kept in-process.
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(maxAttempts: number, windowMs: number): Ratelimit {
  const cacheKey = `${maxAttempts}:${windowMs}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(maxAttempts, `${windowMs} ms`),
      prefix: "gsl-portal:rl",
      analytics: false,
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

async function checkUpstashRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const limiter = getUpstashLimiter(maxAttempts, windowMs);
    const { success, remaining, reset } = await limiter.limit(key);
    const retryAfterSeconds = success
      ? 0
      : Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return {
      allowed: success,
      remaining: Math.max(0, remaining),
      retryAfterSeconds,
    };
  } catch {
    // If Upstash is unreachable, fall back to the in-memory limiter rather
    // than failing open or surfacing 500s on the auth pages.
    return checkMemoryRateLimit(key, maxAttempts, windowMs);
  }
}

// ---------------------------------------------------------------------------
// Public API — always async. Upstash is fundamentally async, so we cannot
// preserve the previous purely synchronous signature; callers add an await.
// ---------------------------------------------------------------------------
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (upstashEnabled) {
    return checkUpstashRateLimit(key, maxAttempts, windowMs);
  }
  return checkMemoryRateLimit(key, maxAttempts, windowMs);
}
