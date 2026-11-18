import type { Context, Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import { isWorkspaceWide } from '../authorization/policy'
import type { AppEnv } from '../env'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { parseJson } from '../lib/request'
import { DATE, recordCtx, ventureCtx, workspaceCtx } from '../lib/scope'
import { createApprovalRequest, declareConflict, expireDue, REQUEST_TYPES, STAGE_TRANSITIONS, stageGateFailures, vote, withdrawRequest, type RequestType } from './engine'

/** Charter content required by docs/MASTER-PROMPT.md §7. Approval status is never set here. */
export const CharterContent = z.object({
  problem: z.string().trim().min(10).max(2000),
  customer: z.string().trim().min(3).max(1000),
  offer: z.string().trim().min(3).max(1000),
  value_proposition: z.string().trim().min(3).max(1000),
  evidence_and_assumptions: z.string().trim().min(3).max(3000),
  business_model: z.string().trim().min(3).max(2000),
  scope_and_exclusions: z.string().trim().min(3).max(2000),
  milestones_and_metrics: z.string().trim().min(3).max(2000),
  accountable_operator: z.string().trim().min(2).max(200),
  contributors_and_roles: z.string().trim().min(2).max(2000),
  contribution_and_ip_treatment: z.string().trim().min(3).max(2000),
  budget_and_spending_controls: z.string().trim().min(3).max(2000),
  risks_and_compliance: z.string().trim().min(3).max(2000),
  exit_pause_conditions: z.string().trim().min(3).max(2000),
  review_date: z.string().regex(DATE),
}).strict()

export function registerGovernanceRoutes(app: Hono<AppEnv>) {
  // ---- Charters ----------------------------------------------------------------------
  app.get('/ventures/:vid/charters', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const rows = (await c.env.DB.prepare(`SELECT id, version, status, content_json, approval_request_id, created_at, updated_at FROM venture_charters WHERE venture_id = ? ORDER BY version DESC`).bind(access.ventureId).all<Record<string, unknown>>()).results
    return ok(c, { charters: rows.map((r) => ({ ...r, content: JSON.parse(String(r.content_json)), content_json: undefined })) })
  })

  app.post('/ventures/:vid/charters', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const content = await parseJson(c, CharterContent)
    const draft = await c.env.DB.prepare(`SELECT id FROM venture_charters WHERE venture_id = ? AND status IN ('draft','submitted')`).bind(access.ventureId).first()
    if (draft) throw new AppError('CONFLICT', 'A draft or submitted charter already exists. Edit or resolve it first.')
    const v = await c.env.DB.prepare(`SELECT COALESCE(MAX(version),0) + 1 AS v FROM venture_charters WHERE venture_id = ?`).bind(access.ventureId).first<{ v: number }>()
    const id = newId('chr')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO venture_charters (id, workspace_id, venture_id, version, status, content_json, created_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, v!.v, JSON.stringify(content), p.personId, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'charter.drafted', targetType: 'venture_charter', targetId: id, requestId: c.get('requestId'), metadata: { version: v!.v } }),
    ])
    return ok(c, { charter: { id, version: v!.v, status: 'draft' } }, 201)
  })

  app.put('/charters/:id', async (c) => {
    const { p, access, id } = await recordCtx(c, 'venture_charters', 'venture.manage', 'Charter')
    const content = await parseJson(c, CharterContent)
    const ch = await c.env.DB.prepare(`SELECT status FROM venture_charters WHERE id = ?`).bind(id).first<{ status: string }>()
    if (ch?.status !== 'draft') throw new AppError('CONFLICT', 'Only draft charters can be edited.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE venture_charters SET content_json = ?, updated_at = ? WHERE id = ? AND status = 'draft'`).bind(JSON.stringify(content), nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'charter.edited', targetType: 'venture_charter', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { status: 'draft' })
  })

  app.post('/charters/:id/submit', async (c) => {
    const { p, access, id } = await recordCtx(c, 'venture_charters', 'governance.request', 'Charter')
    const body = await parseJson(c, z.object({ rationale: z.string().trim().min(3).max(1000), required_approvals: z.number().int().min(1).max(5).optional() }))
    const ch = await c.env.DB.prepare(`SELECT version, status FROM venture_charters WHERE id = ?`).bind(id).first<{ version: number; status: string }>()
    if (ch?.status !== 'draft') throw new AppError('CONFLICT', 'Only draft charters can be submitted.')
    const r = await createApprovalRequest(c.env, { principal: p, workspaceId: access.workspaceId, ventureId: access.ventureId, type: 'charter_approval', targetId: id, title: `Charter v${ch.version}`, rationale: body.rationale, requiredApprovals: body.required_approvals, requestId: c.get('requestId') })
    return ok(c, { approval_request: r }, 201)
  })

  // ---- Lifecycle ----------------------------------------------------------------------
  app.get('/ventures/:vid/lifecycle', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const v = await c.env.DB.prepare(`SELECT stage, status FROM ventures WHERE id = ?`).bind(access.ventureId).first<{ stage: string; status: string }>()
    const options = await Promise.all((STAGE_TRANSITIONS[v!.stage] ?? []).map(async (to) => ({ to_stage: to, gate_failures: await stageGateFailures(c.env, access.ventureId, to) })))
    const history = (await c.env.DB.prepare(`SELECT from_stage, to_stage, approval_request_id, changed_at FROM venture_stage_history WHERE venture_id = ? ORDER BY changed_at DESC`).bind(access.ventureId).all()).results
    return ok(c, { stage: v!.stage, status: v!.status, options, history })
  })

  app.post('/ventures/:vid/stage-requests', async (c) => {
    const { p, access } = await ventureCtx(c, 'governance.request')
    const body = await parseJson(c, z.object({ to_stage: z.string(), rationale: z.string().trim().min(3).max(1000), required_approvals: z.number().int().min(1).max(5).optional() }))
    const v = await c.env.DB.prepare(`SELECT name, stage FROM ventures WHERE id = ?`).bind(access.ventureId).first<{ name: string; stage: string }>()
    if (!(STAGE_TRANSITIONS[v!.stage] ?? []).includes(body.to_stage)) throw new AppError('VALIDATION_ERROR', `Transition ${v!.stage} → ${body.to_stage} is not allowed.`)
    const fails = await stageGateFailures(c.env, access.ventureId, body.to_stage)
    if (fails.length) throw new AppError('CONFLICT', `Stage gate not satisfied: ${fails.join('; ')}`, { gate_failures: fails })
    const r = await createApprovalRequest(c.env, { principal: p, workspaceId: access.workspaceId, ventureId: access.ventureId, type: 'stage_transition', targetId: access.ventureId, title: `${v!.name}: ${v!.stage} → ${body.to_stage}`, rationale: body.rationale, payload: { from_stage: v!.stage, to_stage: body.to_stage }, requiredApprovals: body.required_approvals, requestId: c.get('requestId') })
    return ok(c, { approval_request: r }, 201)
  })

  // ---- Approval inbox & decision register ----------------------------------------------
  app.get('/workspaces/:wid/approvals', async (c) => {
    const { p, access } = await workspaceCtx(c, 'workspace.read')
    await expireDue(c.env, access.workspaceId, c.get('requestId'))
    const status = c.req.query('status') ?? 'submitted'
    const wide = isWorkspaceWide(access.role)
    const rows = (await c.env.DB.prepare(
      `SELECT r.id, r.venture_id, v.name AS venture_name, r.request_type, r.title, r.rationale, r.status, r.required_approvals, r.expires_at, r.submitted_at, r.decided_at, r.closed_reason,
              r.requested_by_person_id, rp.display_name AS requested_by, r.subject_person_id, r.payload_json,
              (SELECT COUNT(*) FROM approval_votes x WHERE x.approval_request_id = r.id AND x.decision = 'approve') AS approvals,
              (SELECT decision FROM approval_votes x WHERE x.approval_request_id = r.id AND x.voter_person_id = ?1) AS my_vote,
              (SELECT 1 FROM conflict_declarations x WHERE x.approval_request_id = r.id AND x.person_id = ?1) AS my_conflict
       FROM approval_requests r JOIN people rp ON rp.id = r.requested_by_person_id LEFT JOIN ventures v ON v.id = r.venture_id
       WHERE r.workspace_id = ?2 AND (?3 = 'all' OR r.status = ?3)
         AND (?4 = 1 OR r.venture_id IS NULL OR r.venture_id IN (SELECT venture_id FROM venture_members WHERE person_id = ?1 AND status = 'active'))
       ORDER BY r.created_at DESC LIMIT 100`,
    ).bind(p.personId, access.workspaceId, status, wide ? 1 : 0).all<Record<string, unknown>>()).results
    const eligible = (t: string) => (REQUEST_TYPES[t as RequestType]?.eligible ?? []).includes(access.role)
    return ok(c, {
      role: access.role,
      approvals: rows.map((r) => ({
        ...r, payload: JSON.parse(String(r.payload_json ?? '{}')), payload_json: undefined,
        can_vote: r.status === 'submitted' && eligible(String(r.request_type)) && r.requested_by_person_id !== p.personId && r.subject_person_id !== p.personId && !r.my_vote && !r.my_conflict,
        can_withdraw: r.status === 'submitted' && r.requested_by_person_id === p.personId,
      })),
    })
  })

  app.get('/approvals/:id', async (c) => {
    const r = await c.env.DB.prepare(`SELECT workspace_id, venture_id FROM approval_requests WHERE id = ?`).bind(c.req.param('id')).first<{ workspace_id: string; venture_id: string | null }>()
    if (!r) throw new AppError('NOT_FOUND', 'Approval request not found.')
    try {
      if (r.venture_id) await ventureCtx(c, 'venture.read', r.venture_id)
      else await workspaceCtx(c, 'workspace.read', r.workspace_id)
    } catch (e) {
      if (e instanceof AppError && e.code === 'NOT_FOUND') throw new AppError('NOT_FOUND', 'Approval request not found.')
      throw e
    }
    const req = await c.env.DB.prepare(`SELECT * FROM approval_requests WHERE id = ?`).bind(c.req.param('id')).first<Record<string, unknown>>()
    const events = (await c.env.DB.prepare(`SELECT e.event, e.detail_json, e.created_at, p.display_name AS actor FROM approval_events e LEFT JOIN people p ON p.id = e.actor_person_id WHERE e.approval_request_id = ? ORDER BY e.created_at, e.rowid`).bind(c.req.param('id')).all()).results
    const votes = (await c.env.DB.prepare(`SELECT v.decision, v.rationale, v.created_at, p.display_name AS voter FROM approval_votes v JOIN people p ON p.id = v.voter_person_id WHERE v.approval_request_id = ?`).bind(c.req.param('id')).all()).results
    const conflicts = (await c.env.DB.prepare(`SELECT d.description, d.created_at, p.display_name AS person FROM conflict_declarations d JOIN people p ON p.id = d.person_id WHERE d.approval_request_id = ?`).bind(c.req.param('id')).all()).results
    return ok(c, { request: req, events, votes, conflicts })
  })

  const approvalAccess = async (c: Context<AppEnv>, action: 'governance.vote' | 'workspace.read') => {
    const r = await c.env.DB.prepare(`SELECT workspace_id, venture_id FROM approval_requests WHERE id = ?`).bind(c.req.param('id')).first<{ workspace_id: string; venture_id: string | null }>()
    if (!r) throw new AppError('NOT_FOUND', 'Approval request not found.')
    try {
      return r.venture_id ? await ventureCtx(c, action, r.venture_id) : await workspaceCtx(c, action, r.workspace_id)
    } catch (e) {
      if (e instanceof AppError && e.code === 'NOT_FOUND') throw new AppError('NOT_FOUND', 'Approval request not found.')
      throw e
    }
  }

  app.post('/approvals/:id/votes', async (c) => {
    const { p, access } = await approvalAccess(c, 'governance.vote')
    const body = await parseJson(c, z.object({ decision: z.enum(['approve', 'reject', 'abstain']), rationale: z.string().trim().max(1000).optional() }))
    const status = await vote(c.env, p, access.role, c.req.param('id'), body.decision, body.rationale, c.get('requestId'))
    return ok(c, { status })
  })

  app.post('/approvals/:id/conflicts', async (c) => {
    const { p } = await approvalAccess(c, 'workspace.read')
    const body = await parseJson(c, z.object({ description: z.string().trim().min(3).max(1000) }))
    await declareConflict(c.env, p, c.req.param('id'), body.description, c.get('requestId'))
    return ok(c, { declared: true }, 201)
  })

  app.post('/approvals/:id/withdraw', async (c) => {
    const { p } = await approvalAccess(c, 'workspace.read')
    const body = await parseJson(c, z.object({ reason: z.string().trim().min(3).max(500) }))
    await withdrawRequest(c.env, p, c.req.param('id'), body.reason, c.get('requestId'))
    return ok(c, { status: 'cancelled' })
  })

  app.get('/workspaces/:wid/decisions', async (c) => {
    const { p, access } = await workspaceCtx(c, 'workspace.read')
    const rows = (await c.env.DB.prepare(
      `SELECT d.id, d.venture_id, v.name AS venture_name, d.approval_request_id, d.decision_type, d.title, d.outcome, d.summary, d.authority_json, d.decided_at
       FROM decisions d LEFT JOIN ventures v ON v.id = d.venture_id WHERE d.workspace_id = ?1
         AND (?2 = 1 OR d.venture_id IS NULL OR d.venture_id IN (SELECT venture_id FROM venture_members WHERE person_id = ?3 AND status = 'active'))
       ORDER BY d.decided_at DESC LIMIT 200`,
    ).bind(access.workspaceId, isWorkspaceWide(access.role) ? 1 : 0, p.personId).all<Record<string, unknown>>()).results
    return ok(c, { decisions: rows.map((r) => ({ ...r, authority: JSON.parse(String(r.authority_json)), authority_json: undefined })) })
  })

  // ---- Access review ---------------------------------------------------------------------
  app.get('/workspaces/:wid/access-review', async (c) => {
    const { access } = await workspaceCtx(c, 'workspace.access_review')
    const members = (await c.env.DB.prepare(
      `SELECT wm.person_id, p.display_name, wm.role, wm.created_at, wm.updated_at,
        (SELECT COUNT(*) FROM venture_members vm JOIN ventures v ON v.id = vm.venture_id WHERE vm.person_id = wm.person_id AND vm.status = 'active' AND v.workspace_id = wm.workspace_id) AS venture_assignments,
        (SELECT MAX(a.created_at) FROM audit_events a WHERE a.actor_person_id = wm.person_id AND a.workspace_id = wm.workspace_id) AS last_activity,
        (SELECT i.review_date FROM workspace_invitations i WHERE i.workspace_id = wm.workspace_id AND i.accepted_by_person_id = wm.person_id ORDER BY i.accepted_at DESC LIMIT 1) AS review_date
       FROM workspace_members wm JOIN people p ON p.id = wm.person_id WHERE wm.workspace_id = ? AND wm.status = 'active' ORDER BY wm.created_at`,
    ).bind(access.workspaceId).all()).results
    const reviews = (await c.env.DB.prepare(`SELECT r.id, r.findings_json, r.notes, r.completed_at, p.display_name AS reviewer FROM access_reviews r JOIN people p ON p.id = r.reviewer_person_id WHERE r.workspace_id = ? ORDER BY r.completed_at DESC LIMIT 20`).bind(access.workspaceId).all()).results
    return ok(c, { members, reviews })
  })

  app.post('/workspaces/:wid/access-reviews', async (c) => {
    const { p, access } = await workspaceCtx(c, 'workspace.access_review')
    const body = await parseJson(c, z.object({
      findings: z.array(z.object({ person_id: z.string(), outcome: z.enum(['keep', 'reduce', 'remove']), note: z.string().max(300).optional() })).max(500),
      notes: z.string().trim().max(2000).optional(),
    }))
    const id = newId('acr')
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO access_reviews (id, workspace_id, reviewer_person_id, findings_json, notes, completed_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(id, access.workspaceId, p.personId, JSON.stringify(body.findings), body.notes ?? null, nowIso()),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'access_review.completed', targetType: 'access_review', targetId: id, requestId: c.get('requestId'), metadata: { findings: body.findings.length } }),
    ])
    return ok(c, { access_review: { id } }, 201)
  })
}
