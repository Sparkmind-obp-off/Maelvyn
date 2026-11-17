import type { Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import { authorizeWorkspace, type WorkspaceRole } from '../authorization/policy'
import type { AppEnv, Env } from '../env'
import { AppError, newId, nowIso, ok, sha256Hex } from '../lib/http'
import { rateLimit } from '../lib/ratelimit'
import { parseJson, principalOf } from '../lib/request'

const ROLES = ['workspace_admin', 'governance_approver', 'venture_operator', 'finance_operator', 'viewer'] as const

function newInviteToken(): string {
  const b = new Uint8Array(32)
  crypto.getRandomValues(b)
  return 'inv_' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

async function activeAdminCount(env: Env, workspaceId: string): Promise<number> {
  const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM workspace_members WHERE workspace_id = ? AND role = 'workspace_admin' AND status = 'active'`)
    .bind(workspaceId).first<{ n: number }>()
  return r?.n ?? 0
}

async function memberRow(env: Env, workspaceId: string, personId: string) {
  return env.DB.prepare(`SELECT id, role, status FROM workspace_members WHERE workspace_id = ? AND person_id = ?`)
    .bind(workspaceId, personId).first<{ id: string; role: WorkspaceRole; status: string }>()
}

/**
 * Workspace membership lifecycle: invite → explicit acceptance → role change → offboarding.
 * - Invitations never create membership by themselves; only the invitee's own authenticated acceptance does.
 * - Tokens are stored hashed and shown once. Decided invitations are immutable (DB trigger).
 * - A workspace can never be left without an active admin.
 */
export function registerMemberRoutes(app: Hono<AppEnv>) {
  app.get('/workspaces/:wid/members', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.read', c.get('requestId'))
    const members = (await c.env.DB.prepare(
      `SELECT wm.person_id, p.display_name, wm.role, wm.status, wm.created_at, wm.updated_at
       FROM workspace_members wm JOIN people p ON p.id = wm.person_id
       WHERE wm.workspace_id = ? AND wm.status = 'active' ORDER BY wm.created_at`,
    ).bind(access.workspaceId).all()).results
    let invitations: unknown[] = []
    if (access.role === 'workspace_admin') {
      invitations = (await c.env.DB.prepare(
        `SELECT i.id, i.role, i.venture_id, v.name AS venture_name, i.note, i.status, i.expires_at, i.accepted_at, i.revoked_at, i.created_at,
                a.display_name AS accepted_by
         FROM workspace_invitations i LEFT JOIN ventures v ON v.id = i.venture_id LEFT JOIN people a ON a.id = i.accepted_by_person_id
         WHERE i.workspace_id = ? ORDER BY i.created_at DESC LIMIT 100`,
      ).bind(access.workspaceId).all()).results
    }
    return ok(c, { role: access.role, me: p.personId, members, invitations })
  })

  app.post('/workspaces/:wid/invitations', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.members.manage', c.get('requestId'))
    await rateLimit(c.env, `invite:${p.personId}`, 20)
    const body = await parseJson(c, z.object({
      role: z.enum(ROLES),
      venture_id: z.string().max(64).optional(),
      note: z.string().trim().max(300).optional(),
      expires_in_days: z.number().int().min(1).max(14).default(7),
    }))
    if (body.venture_id) {
      const v = await c.env.DB.prepare(`SELECT 1 AS ok FROM ventures WHERE id = ? AND workspace_id = ?`).bind(body.venture_id, access.workspaceId).first()
      if (!v) throw new AppError('VALIDATION_ERROR', 'Venture does not belong to this workspace.')
    }
    const token = newInviteToken()
    const id = newId('inv')
    const ts = nowIso()
    const expiresAt = new Date(Date.now() + body.expires_in_days * 86400_000).toISOString()
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO workspace_invitations (id, workspace_id, role, venture_id, token_hash, note, status, created_by_person_id, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      ).bind(id, access.workspaceId, body.role, body.venture_id ?? null, await sha256Hex(token), body.note ?? null, p.personId, expiresAt, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: body.venture_id ?? null, actorPersonId: p.personId, action: 'invitation.created', targetType: 'invitation', targetId: id, requestId: c.get('requestId'), metadata: { role: body.role, expires_at: expiresAt } }),
    ])
    // The plaintext token is returned exactly once and never stored.
    return ok(c, { invitation: { id, role: body.role, venture_id: body.venture_id ?? null, expires_at: expiresAt }, token }, 201)
  })

  app.post('/workspaces/:wid/invitations/:iid/revoke', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.members.manage', c.get('requestId'))
    const iid = c.req.param('iid')
    const inv = await c.env.DB.prepare(`SELECT status FROM workspace_invitations WHERE id = ? AND workspace_id = ?`).bind(iid, access.workspaceId).first<{ status: string }>()
    if (!inv) throw new AppError('NOT_FOUND', 'Invitation not found.')
    if (inv.status !== 'pending') throw new AppError('CONFLICT', `Invitation is already ${inv.status}.`)
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_invitations SET status = 'revoked', revoked_at = ? WHERE id = ? AND status = 'pending'`).bind(nowIso(), iid),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'invitation.revoked', targetType: 'invitation', targetId: iid, requestId: c.get('requestId') }),
    ])
    return ok(c, { status: 'revoked' })
  })

  app.post('/invitations/accept', async (c) => {
    const p = principalOf(c)
    await rateLimit(c.env, `invite-accept:${p.personId}`, 10)
    const body = await parseJson(c, z.object({ token: z.string().regex(/^inv_[a-f0-9]{64}$/, 'Invalid invitation token') }))
    const inv = await c.env.DB.prepare(
      `SELECT i.id, i.workspace_id, i.role, i.venture_id, i.status, i.expires_at, w.name AS workspace_name, w.status AS workspace_status
       FROM workspace_invitations i JOIN workspaces w ON w.id = i.workspace_id WHERE i.token_hash = ?`,
    ).bind(await sha256Hex(body.token)).first<{ id: string; workspace_id: string; role: WorkspaceRole; venture_id: string | null; status: string; expires_at: string; workspace_name: string; workspace_status: string }>()
    // Same response for unknown/revoked/accepted/expired to avoid token probing.
    const invalid = new AppError('NOT_FOUND', 'Invitation is invalid, expired, revoked or already used.')
    if (!inv || inv.status !== 'pending' || inv.expires_at <= nowIso() || !['setup', 'active'].includes(inv.workspace_status)) throw invalid
    const existing = await memberRow(c.env, inv.workspace_id, p.personId)
    if (existing?.status === 'active') throw new AppError('CONFLICT', 'You are already an active member of this workspace.')
    const ts = nowIso()
    const stmts = [
      c.env.DB.prepare(`UPDATE workspace_invitations SET status = 'accepted', accepted_by_person_id = ?, accepted_at = ? WHERE id = ? AND status = 'pending'`).bind(p.personId, ts, inv.id),
      existing
        ? c.env.DB.prepare(`UPDATE workspace_members SET role = ?, status = 'active', updated_at = ? WHERE id = ?`).bind(inv.role, ts, existing.id)
        : c.env.DB.prepare(`INSERT INTO workspace_members (id, workspace_id, person_id, role, status, granted_by_person_id, created_at, updated_at)
                            SELECT ?, ?, ?, ?, 'active', created_by_person_id, ?, ? FROM workspace_invitations WHERE id = ?`)
            .bind(newId('wsm'), inv.workspace_id, p.personId, inv.role, ts, ts, inv.id),
      auditStatement(c.env, { workspaceId: inv.workspace_id, ventureId: inv.venture_id, actorPersonId: p.personId, action: 'invitation.accepted', targetType: 'invitation', targetId: inv.id, requestId: c.get('requestId'), metadata: { role: inv.role } }),
    ]
    if (inv.venture_id) {
      stmts.push(c.env.DB.prepare(
        `INSERT INTO venture_members (id, venture_id, person_id, role_label, scope_description, status, created_at, updated_at)
         VALUES (?, ?, ?, 'invited_member', 'Joined via invitation', 'active', ?, ?)
         ON CONFLICT(venture_id, person_id, role_label) DO UPDATE SET status = 'active', updated_at = excluded.updated_at`,
      ).bind(newId('vnm'), inv.venture_id, p.personId, ts, ts))
    }
    await c.env.DB.batch(stmts)
    return ok(c, { workspace: { id: inv.workspace_id, name: inv.workspace_name }, role: inv.role, venture_id: inv.venture_id })
  })

  app.put('/workspaces/:wid/members/:pid', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.members.manage', c.get('requestId'))
    const body = await parseJson(c, z.object({ role: z.enum(ROLES), reason: z.string().trim().min(3).max(300) }))
    const target = await memberRow(c.env, access.workspaceId, c.req.param('pid'))
    if (!target || target.status !== 'active') throw new AppError('NOT_FOUND', 'Member not found.')
    if (target.role === body.role) return ok(c, { role: body.role, changed: false })
    if (target.role === 'workspace_admin' && (await activeAdminCount(c.env, access.workspaceId)) <= 1) {
      throw new AppError('CONFLICT', 'A workspace must keep at least one active admin.')
    }
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_members SET role = ?, granted_by_person_id = ?, updated_at = ? WHERE id = ?`).bind(body.role, p.personId, nowIso(), target.id),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'member.role_changed', targetType: 'person', targetId: c.req.param('pid'), requestId: c.get('requestId'), reason: body.reason, metadata: { from: target.role, to: body.role } }),
    ])
    return ok(c, { role: body.role, changed: true })
  })

  /** Offboarding: an admin may remove a member, and any member may leave voluntarily. */
  app.post('/workspaces/:wid/members/:pid/offboard', async (c) => {
    const p = principalOf(c)
    const wid = c.req.param('wid')
    const pid = c.req.param('pid')
    const self = pid === p.personId
    const access = await authorizeWorkspace(c.env, p, wid, self ? 'workspace.read' : 'workspace.members.manage', c.get('requestId'))
    const body = await parseJson(c, z.object({ reason: z.string().trim().min(3).max(300) }))
    const target = await memberRow(c.env, access.workspaceId, pid)
    if (!target || target.status !== 'active') throw new AppError('NOT_FOUND', 'Member not found.')
    if (target.role === 'workspace_admin' && (await activeAdminCount(c.env, access.workspaceId)) <= 1) {
      throw new AppError('CONFLICT', 'A workspace must keep at least one active admin. Assign another admin first.')
    }
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_members SET status = 'ended', updated_at = ? WHERE id = ?`).bind(ts, target.id),
      // Access to every venture in this workspace ends with the workspace membership (records are kept, not deleted).
      c.env.DB.prepare(`UPDATE venture_members SET status = 'ended', updated_at = ? WHERE person_id = ? AND status <> 'ended' AND venture_id IN (SELECT id FROM ventures WHERE workspace_id = ?)`).bind(ts, pid, access.workspaceId),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: self ? 'member.left' : 'member.offboarded', targetType: 'person', targetId: pid, requestId: c.get('requestId'), reason: body.reason, metadata: { previous_role: target.role } }),
    ])
    return ok(c, { status: 'ended' })
  })
}
