import type { NextRequest } from 'next/server'
import { fail } from './http'

// In-memory limiter: fine for one Node instance. Swap for a shared store when you scale out.
const hits = new Map<string, { n: number; reset: number }>()

export function rateLimit(req: NextRequest, name: string, max: number, windowMs: number, extra = '') {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const key = `${name}:${ip}:${extra}`
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return }
  if (++h.n > max) throw fail(429, 'Too many requests. Try again shortly.', 'rate_limited')
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
}
