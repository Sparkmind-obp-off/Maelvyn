import type { Env } from '../env'
import { AppError } from './http'

/** Fixed-window counter stored in D1 (authoritative-enough for dev; non-financial). */
export async function rateLimit(env: Env, bucket: string, limit: number, windowSeconds = 60) {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString()
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT(bucket, window_start) DO UPDATE SET count = count + 1 RETURNING count`,
  ).bind(bucket, windowStart).first<{ count: number }>()
  if ((row?.count ?? 0) > limit) throw new AppError('RATE_LIMITED', 'Too many requests. Please retry shortly.', { retry_after_seconds: windowSeconds })
}
