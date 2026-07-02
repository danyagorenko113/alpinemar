/**
 * Minimal in-memory rate limiter for the /login server action.
 * Serverless caveat: each cold instance has its own Map, so an attacker
 * spraying across many instances gets N × the budget. Good enough for
 * "slow down a human brute-forcer"; not a DDoS shield.
 */

const buckets = new Map<string, { count: number; resetAt: number }>()

export interface LimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit(key: string, limit: number, windowSeconds: number): LimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 }
}
