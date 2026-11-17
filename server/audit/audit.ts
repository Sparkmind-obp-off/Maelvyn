import type { Env } from '../env'
import { newId, nowIso, redact } from '../lib/http'

export type AuditInput = {
  workspaceId: string
  ventureId?: string | null
  actorPersonId?: string | null
  action: string
  targetType: string
  targetId: string
  requestId: string
  reason?: string | null
  metadata?: Record<string, unknown>
}

export function auditStatement(env: Env, a: AuditInput) {
  const meta = a.metadata ? redact(JSON.stringify(a.metadata)).slice(0, 8000) : null
  return env.DB.prepare(
    `INSERT INTO audit_events (id, workspace_id, venture_id, actor_person_id, action, target_type, target_id, request_id, reason, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(newId('aud'), a.workspaceId, a.ventureId ?? null, a.actorPersonId ?? null, a.action, a.targetType, a.targetId,
    a.requestId, a.reason ?? null, meta, nowIso())
}

export async function audit(env: Env, a: AuditInput) {
  await auditStatement(env, a).run()
}
