interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// Simple in-memory token bucket per IP.
// Production should use Redis/Upstash for distributed rate limiting across instances.
const buckets = new Map<string, TokenBucket>();

const MAX_TOKENS = 10;
const REFILL_RATE = 1;
const REFILL_INTERVAL_MS = 60_000;

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    buckets.set(ip, { tokens: MAX_TOKENS - 1, lastRefill: now });
    return { allowed: true };
  }

  const elapsed = now - bucket.lastRefill;
  const tokensToAdd =
    Math.floor(elapsed / REFILL_INTERVAL_MS) * REFILL_RATE;

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil(
      (REFILL_INTERVAL_MS - (now - bucket.lastRefill)) / 1000,
    );
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }

  bucket.tokens -= 1;
  return { allowed: true };
}
