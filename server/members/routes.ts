import type { Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import { authorizeWorkspace, NON_ADMIN_ROLES, type WorkspaceRole } from '../authorization/policy'
import type { AppEnv, Env } from '../env'
import { AppError, newId, nowIso, ok, sha256Hex } from '../lib/http'
import { notifyStatements } from '../lib/notify'
import { rateLimit } from '../lib/ratelimit'
import { parseJson, principalOf } from '../lib/request'
import { DATE, isActiveWorkspaceMember, ventureCtx } from '../lib/scope'
import { accountPolicy, isPlatformOwner, platformAudit } from '../platform/owner'

function newInviteToken(): string {
  const b = new Uint8Array(32)
  crypto.getRandomValues(b)
  return 'inv_' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

async function memberRow(env: Env, workspaceId: string, personId: string) {
  return env.DB.prepare(`SELECT id, role, status FROM workspace_members WHERE workspace_id = ? AND person_id = ?`)
    .bind(workspaceId, personId).first<{ id: string; role: WorkspaceRole; status: string }>()
}

/**
 * Workspace membership lifecycle (docs/PLATFORM-IDENTITY-AND-ROLE-BOUNDARIES.md):
 * - Invitations are created only by the Platform Owner (sole workspace_admin), bound to one verified email,
 *   can never grant workspace_admin, and never include venture access.
 * - Accounts under an account policy (ACCOUNT_ONLY) require an explicit owner authorization flag + reason.
 * - Membership activates only when the invitee, signed in with the matching verified email, explicitly accepts.
 * - The Platform Owner cannot be demoted or removed through ordinary member routes.
 * - Venture access is a separate assignment: proposed, then accepted by the assignee.
 */
export function registerMemberRoutes(app: Hono<AppEnv>) {
  app.get('/workspaces/:wid/members', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.read', c.get('requestId'))
    const members = (await c.env.DB.prepare(
      `SELECT wm.person_id, p.display_name, wm.role, wm.status, wm.created_at, wm.updated_at,
              (SELECT COUNT(*) FROM venture_members vm JOIN ventures v ON v.id = vm.venture_id WHERE vm.person_id = wm.person_id AND vm.status = 'active' AND v.workspace_id = wm.workspace_id) AS venture_assignments
       FROM workspace_members wm JOIN people p ON p.id = wm.person_id
       WHERE wm.workspace_id = ? AND wm.status = 'active' ORDER BY wm.created_at`,
    ).bind(access.workspaceId).all()).results
    let invitations: unknown[] = []
    if (access.role === 'workspace_admin') {
      invitations = (await c.env.DB.prepare(
        `SELECT i.id, i.role, i.invitee_email, i.reason, i.owner_authorized, i.review_date, i.status, i.expires_at, i.accepted_at, i.revoked_at, i.created_at,
                a.display_name AS accepted_by
         FROM workspace_invitations i LEFT JOIN people a ON a.id = i.accepted_by_person_id
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
      role: z.enum(NON_ADMIN_ROLES),
      invitee_email: z.email().max(200).transform((s) => s.toLowerCase()),
      reason: z.string().trim().min(3).max(300),
      review_date: z.string().regex(DATE).optional(),
      expires_in_days: z.number().int().min(1).max(14).default(7),
      owner_authorization: z.boolean().optional(),
    }).strict())
    const policy = await accountPolicy(c.env, body.invitee_email)
    if (policy) {
      if (!(await isPlatformOwner(c.env, p.personId)) || body.owner_authorization !== true) {
        throw new AppError('APPROVAL_REQUIRED', 'This account is ACCOUNT_ONLY / NO_MEMBERSHIP. A scoped invitation requires an explicit Platform Owner authorization (owner_authorization: true) with a reason.', { account_policy: policy.policy })
      }
    }
    const token = newInviteToken()
    const id = newId('inv')
    const ts = nowIso()
    const expiresAt = new Date(Date.now() + body.expires_in_days * 86400_000).toISOString()
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO workspace_invitations (id, workspace_id, role, venture_id, token_hash, note, status, created_by_person_id, expires_at, created_at, invitee_email, reason, review_date, owner_authorized)
         VALUES (?, ?, ?, NULL, ?, NULL, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, access.workspaceId, body.role, await sha256Hex(token), p.personId, expiresAt, ts, body.invitee_email, body.reason, body.review_date ?? null, policy ? 1 : 0),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'invitation.created', targetType: 'invitation', targetId: id, requestId: c.get('requestId'), reason: body.reason, metadata: { role: body.role, invitee_email: body.invitee_email, expires_at: expiresAt, owner_authorized: !!policy } }),
      ...(policy ? [platformAudit(c.env, { actorPersonId: p.personId, action: 'account_policy.owner_authorized_invitation', targetType: 'invitation', targetId: id, requestId: c.get('requestId'), reason: body.reason, metadata: { invitee_email: body.invitee_email, workspace_id: access.workspaceId, role: body.role } })] : []),
    ])
    return ok(c, { invitation: { id, role: body.role, invitee_email: body.invitee_email, expires_at: expiresAt }, token }, 201)
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
    const p0 = principalOf(c)
    await rateLimit(c.env, `invite-accept:${p0.personId}`, 10)
    const body = await parseJson(c, z.object({ token: z.string().regex(/^inv_[a-f0-9]{64}$/, 'Invalid invitation token') }))
    const inv = await c.env.DB.prepare(
      `SELECT i.id, i.workspace_id, i.role, i.status, i.expires_at, i.invitee_email, i.created_by_person_id, w.name AS workspace_name, w.status AS workspace_status
       FROM workspace_invitations i JOIN workspaces w ON w.id = i.workspace_id WHERE i.token_hash = ?`,
    ).bind(await sha256Hex(body.token)).first<{ id: string; workspace_id: string; role: WorkspaceRole; status: string; expires_at: string; invitee_email: string | null; created_by_person_id: string; workspace_name: string; workspace_status: string }>()
    const invalid = new AppError('NOT_FOUND', 'Invitation is invalid, expired, revoked or already used.')
    if (!inv || inv.status !== 'pending' || inv.expires_at <= nowIso() || !['setup', 'active'].includes(inv.workspace_status) || !inv.invitee_email) throw invalid
    if (inv.role === 'workspace_admin') throw invalid
    // Re-read the verified primary email from the identity provider on this request.
    const refresh = c.get('refreshProfile')
    const p = refresh ? await refresh() : p0
    if (!p.emailVerified || p.email !== inv.invitee_email) throw new AppError('FORBIDDEN', 'This invitation is bound to a different verified email address.')
    const existing = await memberRow(c.env, inv.workspace_id, p.personId)
    if (existing?.status === 'active') throw new AppError('CONFLICT', 'You are already an active member of this workspace.')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_invitations SET status = 'accepted', accepted_by_person_id = ?, accepted_at = ? WHERE id = ? AND status = 'pending'`).bind(p.personId, ts, inv.id),
      existing
        ? c.env.DB.prepare(`UPDATE workspace_members SET role = ?, status = 'active', granted_by_person_id = ?, updated_at = ? WHERE id = ?`).bind(inv.role, inv.created_by_person_id, ts, existing.id)
        : c.env.DB.prepare(`INSERT INTO workspace_members (id, workspace_id, person_id, role, status, granted_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`)
            .bind(newId('wsm'), inv.workspace_id, p.personId, inv.role, inv.created_by_person_id, ts, ts),
      auditStatement(c.env, { workspaceId: inv.workspace_id, actorPersonId: p.personId, action: 'invitation.accepted', targetType: 'invitation', targetId: inv.id, requestId: c.get('requestId'), metadata: { role: inv.role } }),
      ...notifyStatements(c.env, [inv.created_by_person_id], { workspaceId: inv.workspace_id, kind: 'membership', title: `${p.displayName} accepted a workspace invitation`, link: `/w/${inv.workspace_id}/members` }),
    ])
    return ok(c, { workspace: { id: inv.workspace_id, name: inv.workspace_name }, role: inv.role })
  })

  app.put('/workspaces/:wid/members/:pid', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.members.manage', c.get('requestId'))
    const body = await parseJson(c, z.object({ role: z.enum(NON_ADMIN_ROLES), reason: z.string().trim().min(3).max(300) }).strict())
    const target = await memberRow(c.env, access.workspaceId, c.req.param('pid'))
    if (!target || target.status !== 'active') throw new AppError('NOT_FOUND', 'Member not found.')
    if (target.role === 'workspace_admin' || (await isPlatformOwner(c.env, c.req.param('pid')))) {
      throw new AppError('FORBIDDEN', 'The Platform Owner role cannot be changed through member management.')
    }
    if (target.role === body.role) return ok(c, { role: body.role, changed: false })
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_members SET role = ?, granted_by_person_id = ?, updated_at = ? WHERE id = ?`).bind(body.role, p.personId, nowIso(), target.id),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'member.role_changed', targetType: 'person', targetId: c.req.param('pid'), requestId: c.get('requestId'), reason: body.reason, metadata: { from: target.role, to: body.role } }),
      ...notifyStatements(c.env, [c.req.param('pid')], { workspaceId: access.workspaceId, kind: 'membership', title: `Your workspace role changed to ${body.role}`, link: `/w/${access.workspaceId}` }),
    ])
    return ok(c, { role: body.role, changed: true })
  })

  /** Offboarding by the owner, or voluntary leave by any non-owner member. Records are kept. */
  app.post('/workspaces/:wid/members/:pid/offboard', async (c) => {
    const p = principalOf(c)
    const wid = c.req.param('wid')
    const pid = c.req.param('pid')
    const self = pid === p.personId
    const access = await authorizeWorkspace(c.env, p, wid, self ? 'workspace.read' : 'workspace.members.manage', c.get('requestId'))
    const body = await parseJson(c, z.object({ reason: z.string().trim().min(3).max(300) }))
    const target = await memberRow(c.env, access.workspaceId, pid)
    if (!target || target.status !== 'active') throw new AppError('NOT_FOUND', 'Member not found.')
    if (target.role === 'workspace_admin' || (await isPlatformOwner(c.env, pid))) {
      throw new AppError('FORBIDDEN', 'The Platform Owner cannot be removed through ordinary member routes.')
    }
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_members SET status = 'ended', updated_at = ? WHERE id = ?`).bind(ts, target.id),
      c.env.DB.prepare(`UPDATE venture_members SET status = 'ended', updated_at = ? WHERE person_id = ? AND status <> 'ended' AND venture_id IN (SELECT id FROM ventures WHERE workspace_id = ?)`).bind(ts, pid, access.workspaceId),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: self ? 'member.left' : 'member.offboarded', targetType: 'person', targetId: pid, requestId: c.get('requestId'), reason: body.reason, metadata: { previous_role: target.role } }),
    ])
    return ok(c, { status: 'ended' })
  })

  // ---- Venture assignments (separate from workspace membership) --------------------
  app.get('/ventures/:vid/assignments', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const rows = (await c.env.DB.prepare(
      `SELECT vm.id, vm.person_id, p.display_name, vm.role_label, vm.scope_description, vm.status, vm.reason, vm.accepted_at, vm.created_at, pp.display_name AS proposed_by
       FROM venture_members vm JOIN people p ON p.id = vm.person_id LEFT JOIN people pp ON pp.id = vm.proposed_by_person_id
       WHERE vm.venture_id = ? ORDER BY vm.status, vm.created_at`,
    ).bind(access.ventureId).all()).results
    return ok(c, { assignments: rows })
  })

  app.post('/ventures/:vid/assignments', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({
      person_id: z.string().min(4).max(64),
      role_label: z.string().trim().regex(/^[a-z][a-z0-9_]{2,40}$/, 'Use a lowercase role label, e.g. contributor'),
      scope_description: z.string().trim().max(300).optional(),
      reason: z.string().trim().min(3).max(300),
    }).strict())
    if (!(await isActiveWorkspaceMember(c.env, access.workspaceId, body.person_id))) throw new AppError('VALIDATION_ERROR', 'Assignee must be an active member of this workspace.')
    const existing = await c.env.DB.prepare(`SELECT id, status FROM venture_members WHERE venture_id = ? AND person_id = ? AND role_label = ?`).bind(access.ventureId, body.person_id, body.role_label).first<{ id: string; status: string }>()
    if (existing && existing.status !== 'ended') throw new AppError('CONFLICT', `Assignment already ${existing.status}.`)
    const ts = nowIso()
    const id = existing?.id ?? newId('vnm')
    const self = body.person_id === p.personId
    const status = self ? 'active' : 'proposed'
    await c.env.DB.batch([
      existing
        ? c.env.DB.prepare(`UPDATE venture_members SET status = ?, scope_description = ?, proposed_by_person_id = ?, reason = ?, accepted_at = ?, updated_at = ? WHERE id = ?`).bind(status, body.scope_description ?? null, p.personId, body.reason, self ? ts : null, ts, id)
        : c.env.DB.prepare(`INSERT INTO venture_members (id, venture_id, person_id, role_label, scope_description, status, created_at, updated_at, proposed_by_person_id, accepted_at, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(id, access.ventureId, body.person_id, body.role_label, body.scope_description ?? null, status, ts, ts, p.personId, self ? ts : null, body.reason),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: self ? 'venture_assignment.self_assigned' : 'venture_assignment.proposed', targetType: 'person', targetId: body.person_id, requestId: c.get('requestId'), reason: body.reason, metadata: { role_label: body.role_label } }),
      ...(self ? [] : notifyStatements(c.env, [body.person_id], { workspaceId: access.workspaceId, kind: 'assignment', title: `You were proposed for a venture assignment (${body.role_label})`, link: '/me' })),
    ])
    return ok(c, { assignment: { id, status } }, 201)
  })

  app.post('/ventures/:vid/assignments/:aid/end', async (c) => {
    const p = principalOf(c)
    const a = await c.env.DB.prepare(`SELECT id, person_id, status FROM venture_members WHERE id = ? AND venture_id = ?`).bind(c.req.param('aid'), c.req.param('vid')).first<{ id: string; person_id: string; status: string }>()
    const self = a?.person_id === p.personId
    const { access } = await ventureCtx(c, self ? 'venture.read' : 'venture.manage')
    if (!a) throw new AppError('NOT_FOUND', 'Assignment not found.')
    if (a.status === 'ended') throw new AppError('CONFLICT', 'Assignment already ended.')
    const body = await parseJson(c, z.object({ reason: z.string().trim().min(3).max(300) }))
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE venture_members SET status = 'ended', updated_at = ? WHERE id = ?`).bind(nowIso(), a.id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'venture_assignment.ended', targetType: 'person', targetId: a.person_id, requestId: c.get('requestId'), reason: body.reason }),
    ])
    return ok(c, { status: 'ended' })
  })
}
