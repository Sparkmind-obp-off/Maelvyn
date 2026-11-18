import type { Env } from '../env'
import { AppError, nowIso, sha256Hex } from './http'

/** Runs `fn` once per (scope, key); same-body replays return the stored result, different bodies conflict. */
export async function withIdempotency<T extends Record<string, unknown>>(env: Env, scope: string, key: string | undefined, body: unknown, fn: () => Promise<T>): Promise<{ result: T; replayed: boolean }> {
  if (!key || !/^[A-Za-z0-9_-]{8,100}$/.test(key)) throw new AppError('VALIDATION_ERROR', 'A valid Idempotency-Key header (8–100 chars) is required.')
  const hash = await sha256Hex(JSON.stringify(body))
  const prior = await env.DB.prepare(`SELECT request_hash, response_json FROM idempotency_records WHERE scope = ? AND idem_key = ?`).bind(scope, key).first<{ request_hash: string; response_json: string }>()
  if (prior) {
    if (prior.request_hash !== hash) throw new AppError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was already used with a different request.')
    return { result: JSON.parse(prior.response_json) as T, replayed: true }
  }
  const result = await fn()
  await env.DB.prepare(`INSERT OR IGNORE INTO idempotency_records (scope, idem_key, request_hash, response_status, response_json, created_at) VALUES (?, ?, ?, 200, ?, ?)`)
    .bind(scope, key, hash, JSON.stringify(result), nowIso()).run()
  return { result, replayed: false }
}
