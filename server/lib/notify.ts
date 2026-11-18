import type { Env } from '../env'
import { newId, nowIso } from './http'

/** In-app notifications only. MAELVYN never sends external messages without separate approval. */
export function notifyStatements(env: Env, personIds: (string | null | undefined)[], n: { workspaceId?: string | null; kind: string; title: string; link?: string | null }) {
  const ts = nowIso()
  return [...new Set(personIds.filter((x): x is string => !!x))].map((pid) =>
    env.DB.prepare(`INSERT INTO notifications (id, person_id, workspace_id, kind, title, link, read_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`)
      .bind(newId('ntf'), pid, n.workspaceId ?? null, n.kind, n.title.slice(0, 200), n.link ?? null, ts))
}
