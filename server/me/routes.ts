import type { Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import type { AppEnv } from '../env'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { notifyStatements } from '../lib/notify'
import { rateLimit } from '../lib/ratelimit'
import { parseJson, principalOf } from '../lib/request'
import { activeOwner, platformAudit } from '../platform/owner'

/** Personal routes: only ever return data about the signed-in account itself. */
export function registerMeRoutes(app: Hono<AppEnv>) {
  app.get('/me/notifications', async (c) => {
    const p = principalOf(c)
    return ok(c, { notifications: (await c.env.DB.prepare(`SELECT id, workspace_id, kind, title, link, read_at, created_at FROM notifications WHERE person_id = ? ORDER BY created_at DESC LIMIT 100`).bind(p.personId).all()).results })
  })

  app.post('/me/notifications/read', async (c) => {
    const p = principalOf(c)
    const body = await parseJson(c, z.object({ ids: z.array(z.string()).max(200).optional() }))
    if (body.ids?.length) await c.env.DB.prepare(`UPDATE notifications SET read_at = ? WHERE person_id = ? AND read_at IS NULL AND id IN (${body.ids.map(() => '?').join(',')})`).bind(nowIso(), p.personId, ...body.ids).run()
    else await c.env.DB.prepare(`UPDATE notifications SET read_at = ? WHERE person_id = ? AND read_at IS NULL`).bind(nowIso(), p.personId).run()
    return ok(c, { read: true })
  })

  app.get('/me/assignments', async (c) => {
    const p = principalOf(c)
    const rows = (await c.env.DB.prepare(
      `SELECT vm.id, vm.venture_id, v.name AS venture_name, v.workspace_id, vm.role_label, vm.scope_description, vm.status, vm.reason, vm.created_at, pp.display_name AS proposed_by
       FROM venture_members vm JOIN ventures v ON v.id = vm.venture_id LEFT JOIN people pp ON pp.id = vm.proposed_by_person_id
       JOIN workspace_members wm ON wm.workspace_id = v.workspace_id AND wm.person_id = vm.person_id AND wm.status = 'active'
       WHERE vm.person_id = ? AND vm.status IN ('proposed','active') ORDER BY vm.status DESC, vm.created_at DESC`,
    ).bind(p.personId).all()).results
    return ok(c, { assignments: rows })
  })

  /** Only the assignee can accept or decline a proposed venture assignment. */
  app.post('/me/assignments/:id/respond', async (c) => {
    const p = principalOf(c)
    const body = await parseJson(c, z.object({ decision: z.enum(['accept', 'decline']) }))
    const a = await c.env.DB.prepare(
      `SELECT vm.id, vm.venture_id, v.workspace_id, vm.status, vm.person_id, vm.proposed_by_person_id, vm.role_label FROM venture_members vm JOIN ventures v ON v.id = vm.venture_id
       JOIN workspace_members wm ON wm.workspace_id = v.workspace_id AND wm.person_id = vm.person_id AND wm.status = 'active' WHERE vm.id = ? AND vm.person_id = ?`,
    ).bind(c.req.param('id'), p.personId).first<{ id: string; venture_id: string; workspace_id: string; status: string; proposed_by_person_id: string | null; role_label: string }>()
    if (!a) throw new AppError('NOT_FOUND', 'Assignment not found.')
    if (a.status !== 'proposed') throw new AppError('CONFLICT', `Assignment is ${a.status}.`)
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE venture_members SET status = ?, accepted_at = ?, updated_at = ? WHERE id = ? AND status = 'proposed'`).bind(body.decision === 'accept' ? 'active' : 'ended', body.decision === 'accept' ? ts : null, ts, a.id),
      auditStatement(c.env, { workspaceId: a.workspace_id, ventureId: a.venture_id, actorPersonId: p.personId, action: `venture_assignment.${body.decision === 'accept' ? 'accepted' : 'declined'}`, targetType: 'person', targetId: p.personId, requestId: c.get('requestId'), metadata: { role_label: a.role_label } }),
      ...notifyStatements(c.env, [a.proposed_by_person_id], { workspaceId: a.workspace_id, kind: 'assignment', title: `${p.displayName} ${body.decision === 'accept' ? 'accepted' : 'declined'} a venture assignment`, link: `/w/${a.workspace_id}/v/${a.venture_id}` }),
    ])
    return ok(c, { status: body.decision === 'accept' ? 'active' : 'ended' })
  })

  /** Personal data export (the account's own records only). */
  app.get('/me/export', async (c) => {
    const p = principalOf(c)
    await rateLimit(c.env, `export:${p.personId}`, 5)
    const q = (sql: string) => c.env.DB.prepare(sql).bind(p.personId).all().then((r) => r.results)
    const data = {
      account: await c.env.DB.prepare(`SELECT id, display_name, contact_email, email_verified, status, created_at FROM people WHERE id = ?`).bind(p.personId).first(),
      identity_links: await q(`SELECT provider, provider_subject, created_at FROM identity_links WHERE person_id = ?`),
      workspace_memberships: await q(`SELECT workspace_id, role, status, created_at, updated_at FROM workspace_members WHERE person_id = ?`),
      venture_assignments: await q(`SELECT venture_id, role_label, status, accepted_at, created_at FROM venture_members WHERE person_id = ?`),
      contributions: await q(`SELECT id, venture_id, contribution_type, legal_character, description, currency, agreed_value_minor, status, created_at FROM contributions WHERE contributor_person_id = ?`),
      agreement_parties: await q(`SELECT agreement_id, party_role, signature_status, signed_at FROM agreement_parties WHERE person_id = ?`),
      ownership_interests: await q(`SELECT id, venture_id, interest_type, quantity, percentage_basis_points, status, effective_at FROM ownership_interests WHERE holder_person_id = ?`),
      approval_votes: await q(`SELECT approval_request_id, decision, rationale, created_at FROM approval_votes WHERE voter_person_id = ?`),
      notifications: await q(`SELECT kind, title, read_at, created_at FROM notifications WHERE person_id = ?`),
      data_requests: await q(`SELECT request_type, status, resolution, created_at, resolved_at FROM data_requests WHERE person_id = ?`),
    }
    return ok(c, { exported_at: nowIso(), scope: 'own account only', data })
  })

  app.get('/me/data-requests', async (c) => {
    const p = principalOf(c)
    return ok(c, { requests: (await c.env.DB.prepare(`SELECT id, request_type, note, status, resolution, created_at, resolved_at FROM data_requests WHERE person_id = ? ORDER BY created_at DESC`).bind(p.personId).all()).results })
  })

  app.post('/me/data-requests', async (c) => {
    const p = principalOf(c)
    await rateLimit(c.env, `data-request:${p.personId}`, 5)
    const body = await parseJson(c, z.object({ request_type: z.enum(['export', 'deletion', 'correction']), note: z.string().trim().max(1000).optional() }))
    const id = newId('dsr')
    const owner = await activeOwner(c.env)
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO data_requests (id, person_id, request_type, note, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)`).bind(id, p.personId, body.request_type, body.note ?? null, nowIso()),
      platformAudit(c.env, { actorPersonId: p.personId, action: 'data_request.opened', targetType: 'data_request', targetId: id, requestId: c.get('requestId'), metadata: { type: body.request_type } }),
      ...notifyStatements(c.env, [owner?.person_id], { kind: 'data_request', title: `New ${body.request_type} data request`, link: '/platform' }),
    ])
    return ok(c, { request: { id, status: 'open', note: 'Deletion requests are reviewed by the Platform Owner; financial, agreement and audit records are retained where required.' } }, 201)
  })
}
