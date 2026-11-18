import type { Context } from 'hono'
import type { AppEnv, Env } from '../env'
import { AppError, newId, nowIso, redact } from '../lib/http'
import { principalOf } from '../lib/request'

/** docs/PLATFORM-IDENTITY-AND-ROLE-BOUNDARIES.md §1 — the single Platform Owner account. */
export const DEFAULT_PLATFORM_OWNER_EMAIL = 'sparkmind.support@gmail.com'
export const ownerEmail = (env: Env) => (env.PLATFORM_OWNER_EMAIL ?? DEFAULT_PLATFORM_OWNER_EMAIL).trim().toLowerCase()

export async function activeOwner(env: Env) {
  return env.DB.prepare(`SELECT id, person_id, provider_subject, verified_email, bound_at FROM platform_roles WHERE role = 'platform_owner' AND status = 'active'`)
    .first<{ id: string; person_id: string; provider_subject: string; verified_email: string; bound_at: string }>()
}

export async function isPlatformOwner(env: Env, personId: string) {
  const o = await activeOwner(env)
  return !!o && o.person_id === personId
}

export async function requireOwner(c: Context<AppEnv>) {
  const p = principalOf(c)
  if (!(await isPlatformOwner(c.env, p.personId))) throw new AppError('FORBIDDEN', 'Platform owner only.')
  return p
}

export async function accountPolicy(env: Env, email: string | null) {
  if (!email) return null
  return env.DB.prepare(`SELECT email_lower, policy, reason, source FROM account_policies WHERE email_lower = ?`).bind(email.toLowerCase())
    .first<{ email_lower: string; policy: string; reason: string; source: string }>()
}

export function platformAudit(env: Env, a: { actorPersonId: string | null; action: string; targetType: string; targetId: string; requestId: string; reason?: string | null; metadata?: Record<string, unknown> }) {
  return env.DB.prepare(
    `INSERT INTO platform_audit_events (id, actor_person_id, action, target_type, target_id, request_id, reason, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(newId('pau'), a.actorPersonId, a.action, a.targetType, a.targetId, a.requestId, a.reason ?? null, a.metadata ? redact(JSON.stringify(a.metadata)) : null, nowIso())
}
