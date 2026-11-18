import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT'
  | 'IDEMPOTENCY_CONFLICT' | 'BUDGET_EXCEEDED' | 'APPROVAL_REQUIRED' | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_DISABLED' | 'KILL_SWITCH_ENGAGED' | 'RATE_LIMITED' | 'PROVIDER_ERROR' | 'LEDGER_NOT_BALANCED' | 'SERVICE_UNAVAILABLE' | 'INTERNAL_ERROR'

const STATUS: Record<ErrorCode, ContentfulStatusCode> = {
  UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VALIDATION_ERROR: 400, CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409, BUDGET_EXCEEDED: 402, APPROVAL_REQUIRED: 403, PROVIDER_NOT_CONFIGURED: 412,
  PROVIDER_DISABLED: 412, KILL_SWITCH_ENGAGED: 423, RATE_LIMITED: 429, PROVIDER_ERROR: 502, LEDGER_NOT_BALANCED: 422, SERVICE_UNAVAILABLE: 503, INTERNAL_ERROR: 500,
}

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public details: Record<string, unknown> = {}) {
    super(message)
  }
  get status(): ContentfulStatusCode { return STATUS[this.code] }
}

export function errorBody(code: ErrorCode, message: string, requestId: string, details: Record<string, unknown> = {}) {
  return { error: { code, message, details }, request_id: requestId }
}

export function ok<T extends Record<string, unknown>>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ ...data, request_id: c.get('requestId') }, status)
}

/** Opaque, non-sequential identifiers. */
export function newId(prefix: string): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export const nowIso = () => new Date().toISOString()
export const todayUtc = () => new Date().toISOString().slice(0, 10)

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Strip control characters and cap length for any untrusted external text. */
export function sanitizeText(v: unknown, max = 2000): string {
  if (typeof v !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function safeHttpUrl(v: unknown): string | null {
  if (typeof v !== 'string') return null
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch { return null }
}

/** Redact anything that looks like a credential before logging/auditing. */
export function redact(s: string): string {
  return s
    .replace(/(sk_(test|live)_)[A-Za-z0-9]+/g, '$1[REDACTED]')
    .replace(/tvly-[A-Za-z0-9_-]+/g, 'tvly-[REDACTED]')
    .replace(/fc-[a-f0-9]{8,}/g, 'fc-[REDACTED]')
    .replace(/apify_api_[A-Za-z0-9]+/g, 'apify_api_[REDACTED]')
    .replace(/scrapely_[A-Za-z0-9_]+/g, 'scrapely_[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
}
