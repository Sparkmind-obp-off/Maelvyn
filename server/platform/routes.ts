import type { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../env'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { notifyStatements } from '../lib/notify'
import { rateLimit } from '../lib/ratelimit'
import { parseJson, principalOf } from '../lib/request'
import { accountPolicy, activeOwner, ownerEmail, platformAudit, requireOwner } from './owner'

type AccountRow = {
  id: string; display_name: string; contact_email: string | null; email_verified: number; created_at: string; provider_subject: string | null
  active_memberships: number; suspended_memberships: number; active_assignments: number; platform_role: string | null; account_policy: string | null
}

export function classifyAccount(r: Pick<AccountRow, 'platform_role' | 'active_memberships' | 'active_assignments'>) {
  if (r.platform_role === 'platform_owner') return 'PLATFORM_OWNER'
  if (r.active_assignments > 0) return 'VENTURE_ASSIGNED'
  if (r.active_memberships > 0) return 'WORKSPACE_MEMBER'
  return 'ACCOUNT_ONLY'
}

/** Account identity, platform role and scoped access are reported separately (policy §3). */
export function registerPlatformRoutes(app: Hono<AppEnv>) {
  app.get('/session', async (c) => {
    const p = principalOf(c)
    const owner = await activeOwner(c.env)
    const isOwner = owner?.person_id === p.personId
    const memberships = (await c.env.DB.prepare(
      `SELECT w.id AS workspace_id, w.name, w.slug, w.is_synthetic, wm.role FROM workspace_members wm JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.person_id = ? AND wm.status = 'active' ORDER BY w.created_at`,
    ).bind(p.personId).all()).results
    const assignments = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM venture_members WHERE person_id = ? AND status = 'active'`).bind(p.personId).first<{ n: number }>()
    const pending = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM venture_members WHERE person_id = ? AND status = 'proposed'`).bind(p.personId).first<{ n: number }>()
    const unread = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM notifications WHERE person_id = ? AND read_at IS NULL`).bind(p.personId).first<{ n: number }>()
    const policy = p.emailVerified ? await accountPolicy(c.env, p.email) : null
    return ok(c, {
      principal: { person_id: p.personId, display_name: p.displayName, email: p.email, email_verified: p.emailVerified },
      platform_role: isOwner ? 'platform_owner' : null,
      owner_bound: !!owner,
      can_claim_owner: !owner && p.emailVerified && p.email === ownerEmail(c.env),
      account_status: classifyAccount({ platform_role: isOwner ? 'platform_owner' : null, active_memberships: memberships.length, active_assignments: assignments?.n ?? 0 }),
      account_policy: policy ? { policy: policy.policy, reason: policy.reason } : null,
      memberships,
      pending_venture_assignments: pending?.n ?? 0,
      unread_notifications: unread?.n ?? 0,
    })
  })

  /**
   * Controlled owner bootstrap: the primary email is re-read from Clerk's Backend API on this request and must be
   * verified and equal the designated owner email. The binding stores the stable Clerk subject ID as evidence.
   */
  app.post('/platform/owner/claim', async (c) => {
    const p0 = principalOf(c)
    await rateLimit(c.env, `owner-claim:${p0.personId}`, 5)
    const refresh = c.get('refreshProfile')
    const p = refresh ? await refresh() : p0
    if (!p.emailVerified || !p.email || p.email !== ownerEmail(c.env)) {
      throw new AppError('FORBIDDEN', 'Only the designated platform owner account with a verified primary email can claim platform ownership.')
    }
    const existing = await activeOwner(c.env)
    if (existing) {
      if (existing.person_id === p.personId) return ok(c, { platform_role: 'platform_owner', already_bound: true, bound_at: existing.bound_at })
      throw new AppError('CONFLICT', 'A platform owner is already bound. Ownership transfer requires a separate audited procedure.')
    }
    const ts = nowIso()
    const id = newId('plr')
    const evidence = { method: 'clerk_backend_api_primary_email_verified', provider: 'clerk', subject: p.subject, email: p.email, verified_at: ts, request_id: c.get('requestId') }
    try {
      await c.env.DB.batch([
        c.env.DB.prepare(`INSERT INTO platform_roles (id, role, person_id, provider, provider_subject, verified_email, status, evidence_json, bound_at) VALUES (?, 'platform_owner', ?, 'clerk', ?, ?, 'active', ?, ?)`)
          .bind(id, p.personId, p.subject, p.email, JSON.stringify(evidence), ts),
        platformAudit(c.env, { actorPersonId: p.personId, action: 'platform_owner.bound', targetType: 'person', targetId: p.personId, requestId: c.get('requestId'), metadata: { subject: p.subject, method: evidence.method } }),
      ])
    } catch (e) {
      if (String(e).includes('UNIQUE')) throw new AppError('CONFLICT', 'A platform owner is already bound.')
      throw e
    }
    return ok(c, { platform_role: 'platform_owner', bound_at: ts }, 201)
  })

  app.get('/platform/accounts', async (c) => {
    await requireOwner(c)
    const rows = (await c.env.DB.prepare(
      `SELECT p.id, p.display_name, p.contact_email, p.email_verified, p.created_at, l.provider_subject,
        (SELECT COUNT(*) FROM workspace_members wm WHERE wm.person_id = p.id AND wm.status = 'active') AS active_memberships,
        (SELECT COUNT(*) FROM workspace_members wm WHERE wm.person_id = p.id AND wm.status = 'suspended') AS suspended_memberships,
        (SELECT COUNT(*) FROM venture_members vm WHERE vm.person_id = p.id AND vm.status = 'active') AS active_assignments,
        pr.role AS platform_role, ap.policy AS account_policy
       FROM people p LEFT JOIN identity_links l ON l.person_id = p.id
       LEFT JOIN platform_roles pr ON pr.person_id = p.id AND pr.status = 'active'
       LEFT JOIN account_policies ap ON ap.email_lower = lower(p.contact_email)
       ORDER BY p.created_at`,
    ).all<AccountRow>()).results
    return ok(c, { accounts: rows.map((r) => ({ ...r, classification: classifyAccount(r) })) })
  })

  app.get('/platform/audit', async (c) => {
    await requireOwner(c)
    const events = (await c.env.DB.prepare(`SELECT a.*, p.display_name AS actor_name FROM platform_audit_events a LEFT JOIN people p ON p.id = a.actor_person_id ORDER BY a.created_at DESC LIMIT 200`).all()).results
    const reconciliation = (await c.env.DB.prepare(`SELECT action, target_id, reason, metadata_json, created_at FROM audit_events WHERE request_id = 'migration-0004' ORDER BY created_at`).all()).results
    return ok(c, { events, reconciliation })
  })

  app.get('/platform/data-requests', async (c) => {
    await requireOwner(c)
    return ok(c, { requests: (await c.env.DB.prepare(`SELECT d.*, p.display_name FROM data_requests d JOIN people p ON p.id = d.person_id ORDER BY d.created_at DESC LIMIT 200`).all()).results })
  })

  app.post('/platform/data-requests/:id/resolve', async (c) => {
    const owner = await requireOwner(c)
    const body = await parseJson(c, z.object({ status: z.enum(['completed', 'declined']), resolution: z.string().trim().min(3).max(1000) }))
    const r = await c.env.DB.prepare(`SELECT person_id, status FROM data_requests WHERE id = ?`).bind(c.req.param('id')).first<{ person_id: string; status: string }>()
    if (!r) throw new AppError('NOT_FOUND', 'Request not found.')
    if (r.status !== 'open') throw new AppError('CONFLICT', 'Request already resolved.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE data_requests SET status = ?, resolution = ?, resolved_by_person_id = ?, resolved_at = ? WHERE id = ? AND status = 'open'`).bind(body.status, body.resolution, owner.personId, nowIso(), c.req.param('id')),
      platformAudit(c.env, { actorPersonId: owner.personId, action: `data_request.${body.status}`, targetType: 'data_request', targetId: c.req.param('id'), requestId: c.get('requestId'), reason: body.resolution }),
      ...notifyStatements(c.env, [r.person_id], { kind: 'data_request', title: `Your data request was ${body.status}`, link: '/me' }),
    ])
    return ok(c, { status: body.status })
  })
}
