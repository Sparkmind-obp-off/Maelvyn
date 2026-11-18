import type { Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import type { AppEnv } from '../env'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { parseJson } from '../lib/request'
import { recordCtx, ventureCtx } from '../lib/scope'

/**
 * Venture-scoped knowledge memory. Access is authorized for ONE venture before retrieval; there is no
 * cross-venture query path. Content is immutable: corrections retract and add a new record.
 * Agent/unreviewed content is never promoted to 'verified_decision' (only the approval engine writes those).
 */
export function registerMemoryRoutes(app: Hono<AppEnv>) {
  app.get('/ventures/:vid/memory', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.read')
    const q = (c.req.query('q') ?? '').trim().slice(0, 100)
    const includeRetracted = c.req.query('include_retracted') === '1'
    const rows = (await c.env.DB.prepare(
      `SELECT m.id, m.kind, m.content, m.source_type, m.source_id, m.citations_json, m.confidence, m.sensitivity, m.status, m.retract_reason, m.created_at, m.retracted_at, p.display_name AS created_by
       FROM memory_records m LEFT JOIN people p ON p.id = m.created_by_person_id
       WHERE m.venture_id = ?1 AND (?2 = 1 OR m.status = 'active') AND (?3 = '' OR m.content LIKE '%' || ?3 || '%' ESCAPE '\\')
       ORDER BY m.created_at DESC LIMIT 100`,
    ).bind(access.ventureId, includeRetracted ? 1 : 0, q.replace(/[%_\\]/g, (ch) => '\\' + ch)).all()).results
    await c.env.DB.prepare(`INSERT INTO memory_access_events (id, workspace_id, venture_id, person_id, query, result_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(newId('mae'), access.workspaceId, access.ventureId, p.personId, q || null, rows.length, nowIso()).run()
    return ok(c, { memory: rows, scope: { venture_id: access.ventureId, cross_venture: false } })
  })

  app.post('/ventures/:vid/memory', async (c) => {
    const { p, access } = await ventureCtx(c, 'memory.write')
    const body = await parseJson(c, z.object({
      kind: z.enum(['insight', 'hypothesis', 'note']), content: z.string().trim().min(3).max(2000),
      confidence: z.enum(['unverified', 'hypothesis']), sensitivity: z.enum(['internal', 'confidential']).default('internal'),
      citations: z.array(z.string().url().max(500)).max(20).optional(),
    }).strict())
    const id = newId('mem')
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO memory_records (id, workspace_id, venture_id, kind, content, source_type, source_id, citations_json, confidence, sensitivity, status, created_by_person_id, created_at) VALUES (?, ?, ?, ?, ?, 'manual', NULL, ?, ?, ?, 'active', ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.kind, body.content, body.citations ? JSON.stringify(body.citations) : null, body.confidence, body.sensitivity, p.personId, nowIso()),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'memory.recorded', targetType: 'memory', targetId: id, requestId: c.get('requestId'), metadata: { kind: body.kind, confidence: body.confidence } }),
    ])
    return ok(c, { memory: { id } }, 201)
  })

  /** Promote an ACCEPTED research brief's cited findings into memory (unverified source findings). */
  app.post('/research/:tid/to-memory', async (c) => {
    const t = await c.env.DB.prepare(`SELECT venture_id FROM research_artifacts WHERE task_id = ?`).bind(c.req.param('tid')).first<{ venture_id: string }>()
    if (!t) throw new AppError('NOT_FOUND', 'Research brief not found.')
    const { p, access } = await ventureCtx(c, 'memory.write', t.venture_id)
    const art = await c.env.DB.prepare(`SELECT id, status, brief_json FROM research_artifacts WHERE task_id = ?`).bind(c.req.param('tid')).first<{ id: string; status: string; brief_json: string }>()
    if (art!.status !== 'accepted') throw new AppError('CONFLICT', 'Only human-accepted briefs can be added to memory.')
    const dup = await c.env.DB.prepare(`SELECT 1 AS ok FROM memory_records WHERE source_type = 'research_artifact' AND source_id = ?`).bind(art!.id).first()
    if (dup) throw new AppError('CONFLICT', 'This brief is already in memory.')
    const brief = JSON.parse(art!.brief_json) as { synthetic: boolean; reported_findings: { statement: string; citations: number[] }[]; sources: { n: number; url: string }[] }
    if (brief.synthetic) throw new AppError('CONFLICT', 'Synthetic briefs cannot become venture knowledge.')
    const ts = nowIso()
    const stmts = brief.reported_findings.slice(0, 20).map((f) => c.env.DB.prepare(
      `INSERT INTO memory_records (id, workspace_id, venture_id, kind, content, source_type, source_id, citations_json, confidence, sensitivity, status, created_by_person_id, created_at) VALUES (?, ?, ?, 'source_finding', ?, 'research_artifact', ?, ?, 'unverified', 'internal', 'active', ?, ?)`,
    ).bind(newId('mem'), access.workspaceId, access.ventureId, f.statement, art!.id, JSON.stringify(f.citations.map((n) => brief.sources.find((s) => s.n === n)?.url).filter(Boolean)), p.personId, ts))
    await c.env.DB.batch([...stmts, auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'memory.imported_from_research', targetType: 'research_artifact', targetId: art!.id, requestId: c.get('requestId'), metadata: { records: stmts.length } })])
    return ok(c, { imported: stmts.length }, 201)
  })

  app.post('/memory/:id/retract', async (c) => {
    const { p, access, id } = await recordCtx(c, 'memory_records', 'memory.write', 'Memory record')
    const body = await parseJson(c, z.object({ reason: z.string().trim().min(3).max(500) }))
    const m = await c.env.DB.prepare(`SELECT status, confidence FROM memory_records WHERE id = ?`).bind(id).first<{ status: string; confidence: string }>()
    if (m!.status !== 'active') throw new AppError('CONFLICT', 'Already retracted.')
    if (m!.confidence === 'verified_decision') throw new AppError('FORBIDDEN', 'Decision records reflect the decision register and cannot be retracted here.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE memory_records SET status = 'retracted', retract_reason = ?, retracted_at = ? WHERE id = ?`).bind(body.reason, nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'memory.retracted', targetType: 'memory', targetId: id, requestId: c.get('requestId'), reason: body.reason }),
    ])
    return ok(c, { status: 'retracted' })
  })
}
