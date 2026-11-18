import { describe, expect, it } from 'vitest'
import { bootstrap, claimOwner, grant, setup } from './helpers'

describe('platform identity boundaries (docs/PLATFORM-IDENTITY-AND-ROLE-BOUNDARIES.md)', () => {
  it('first login creates an ACCOUNT_ONLY identity with no membership, role or venture access', async () => {
    const t = setup()
    const s = await t.call('GET', '/session', 'acct:elfares621@gmail.com')
    expect(s.body).toMatchObject({ account_status: 'ACCOUNT_ONLY', platform_role: null, memberships: [] })
    expect(s.body.account_policy.policy).toBe('owner_authorization_required')
    const n = await t.db.prepare(`SELECT (SELECT COUNT(*) FROM workspace_members) + (SELECT COUNT(*) FROM venture_members) + (SELECT COUNT(*) FROM platform_roles) AS n`).first<{ n: number }>()
    expect(n!.n).toBe(0)
  })

  it('only the verified owner email can claim; exactly one owner; claim is idempotent and audited', async () => {
    const t = setup()
    expect((await t.call('POST', '/platform/owner/claim', 'acct:elmatador0197@gmail.com')).status).toBe(403)
    expect((await t.call('POST', '/platform/owner/claim', 'unverified-owner')).status).toBe(403)
    expect((await claimOwner(t)).status).toBe(201)
    expect((await claimOwner(t)).body.already_bound).toBe(true)
    // a second person with the same email (spoof/duplicate account) cannot become owner
    await t.db.prepare(`INSERT INTO people (id, display_name, contact_email, email_verified, status, created_at, updated_at) VALUES ('per_x','x','sparkmind.support@gmail.com',1,'active','t','t')`).run()
    await expect(t.db.prepare(`INSERT INTO platform_roles (id, role, person_id, provider, provider_subject, verified_email, status, evidence_json, bound_at) VALUES ('p2','platform_owner','per_x','clerk','s2','sparkmind.support@gmail.com','active','{}','t')`).run()).rejects.toThrow()
    await expect(t.db.prepare(`UPDATE platform_roles SET person_id = 'per_x'`).run()).rejects.toThrow()
    await expect(t.db.prepare(`DELETE FROM platform_roles`).run()).rejects.toThrow()
    const s = await t.call('GET', '/session', 'owner')
    expect(s.body).toMatchObject({ platform_role: 'platform_owner', account_status: 'PLATFORM_OWNER' })
    expect((await t.call('GET', '/platform/audit', 'owner')).body.events[0].action).toBe('platform_owner.bound')
  })

  it('non-owners cannot create workspaces or read platform admin views', async () => {
    const t = setup()
    await claimOwner(t)
    expect((await t.call('POST', '/workspaces', 'acct:elfares621@gmail.com', { name: 'Mine' })).status).toBe(403)
    expect((await t.call('GET', '/platform/accounts', 'acct:elfares621@gmail.com')).status).toBe(403)
    expect((await t.call('GET', '/platform/audit', 'bob')).status).toBe(403)
  })

  it('account directory distinguishes owner, account-only, workspace member and venture assigned', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    await t.call('GET', '/session', 'acct:elfares621@gmail.com')
    await grant(t, 'bob', wid, 'viewer')
    await grant(t, 'carol', wid, 'venture_operator', vid)
    const d = await t.call('GET', '/platform/accounts', 'owner')
    const by = Object.fromEntries(d.body.accounts.map((a: { contact_email: string; classification: string }) => [a.contact_email, a.classification]))
    expect(by['sparkmind.support@gmail.com']).toBe('PLATFORM_OWNER')
    expect(by['elfares621@gmail.com']).toBe('ACCOUNT_ONLY')
    expect(by['bob@example.test']).toBe('WORKSPACE_MEMBER')
    expect(by['carol@example.test']).toBe('VENTURE_ASSIGNED')
  })

  it('account-only identities need explicit owner authorization to be invited, and see nothing before acceptance', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    const no = await t.call('POST', `/workspaces/${wid}/invitations`, 'owner', { role: 'viewer', invitee_email: 'elfares621@gmail.com', reason: 'test' })
    expect(no.status).toBe(403)
    expect(no.body.error.code).toBe('APPROVAL_REQUIRED')
    expect((await t.call('GET', `/workspaces/${wid}`, 'acct:elfares621@gmail.com')).status).toBe(404)
    expect((await t.call('GET', `/ventures/${vid}`, 'acct:elfares621@gmail.com')).status).toBe(404)
    expect((await t.call('GET', '/workspaces', 'acct:elfares621@gmail.com')).body.workspaces).toEqual([])
    const yes = await t.call('POST', `/workspaces/${wid}/invitations`, 'owner', { role: 'viewer', invitee_email: 'elfares621@gmail.com', reason: 'explicit owner authorization (test)', owner_authorization: true })
    expect(yes.status).toBe(201)
    expect((await t.call('GET', '/platform/audit', 'owner')).body.events.map((e: { action: string }) => e.action)).toContain('account_policy.owner_authorized_invitation')
  })

  it('a stray workspace_admin row without the platform owner binding grants nothing', async () => {
    const t = setup()
    const { wid } = await bootstrap(t)
    await grant(t, 'mallory', wid, 'workspace_admin')
    expect((await t.call('GET', `/workspaces/${wid}`, 'mallory')).status).toBe(403)
  })

  it('migration 0004 reconciliation suspends legacy memberships (audited) and preserves records', async () => {
    const { D1Shim } = await import('./d1shim')
    const { readFileSync, readdirSync } = await import('node:fs')
    const d = new D1Shim()
    const files = readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort()
    for (const f of files.slice(0, 3)) d.db.exec(readFileSync(`migrations/${f}`, 'utf8'))
    d.db.exec(`INSERT INTO workspaces (id,name,slug,created_at,updated_at) VALUES ('w1','W','w','t','t');
      INSERT INTO people (id,display_name,status,created_at,updated_at) VALUES ('p1','Legacy','active','t','t');
      INSERT INTO workspace_members (id,workspace_id,person_id,role,status,created_at,updated_at) VALUES ('m1','w1','p1','workspace_admin','active','t','t');`)
    for (const f of files.slice(3)) d.db.exec(readFileSync(`migrations/${f}`, 'utf8'))
    expect(d.db.prepare(`SELECT status FROM workspace_members WHERE id='m1'`).get()).toMatchObject({ status: 'suspended' })
    expect(d.db.prepare(`SELECT COUNT(*) AS n FROM audit_events WHERE action='membership.suspended_by_reconciliation'`).get()).toMatchObject({ n: 1 })
  })
})
