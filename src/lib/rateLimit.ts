/**
 * In-memory rate limiter for API routes.
 * Suitable for single-instance deployments (Netlify functions, single Node process).
 * For multi-instance / edge deployments, replace with an external store (Redis/Upstash).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Prune stale entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /** Maximum requests allowed within the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and record a request for the given key (typically an IP address).
 * Returns whether the request is allowed and how many requests remain.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // First request in a fresh window
    const resetAt = now + options.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt }
  }

  existing.count += 1
  const allowed = existing.count <= options.limit
  return {
    allowed,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  }
}

/**
 * Extract a client IP from a Next.js Request, falling back to a fixed sentinel
 * so the limiter still works even when the IP is unavailable.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
