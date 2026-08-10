// In-memory per-key sliding-window limiter for the /api/chat/stream proxy.
//
// ai-layer's own rate limit on /ai/agent/run/stream is keyed by X-API-Key
// (see app/middleware/rate_limit.py), and this proxy always sends the same
// service key — so every cine-flow visitor shares ONE bucket at ai-layer.
// This limiter throttles per caller *before* that shared bucket is touched,
// so one active chatter can't starve everyone else. It resets on server
// restart/redeploy — acceptable for this purpose, not meant as the only line
// of defense (raise ai-layer's AGENT_RATE_LIMIT generously to compensate).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}
