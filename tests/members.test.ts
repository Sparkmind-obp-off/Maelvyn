import { describe, expect, it } from 'vitest'
import { bootstrap, grant, setup } from './helpers'

async function invite(t: ReturnType<typeof setup>, wid: string, body: Record<string, unknown>, user = 'alice') {
  return t.call('POST', `/workspaces/${wid}/invitations`, user, body)
}

describe('workspace membership lifecycle', () => {
  it('invite → explicit acceptance grants role (and venture access) exactly once', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    const inv = await invite(t, wid, { role: 'venture_operator', venture_id: vid })
    expect(inv.status).toBe(201)
    expect(inv.body.token).toMatch(/^inv_[a-f0-9]{64}$/)
    // token is stored hashed only
    const raw = await t.db.prepare(`SELECT token_hash FROM workspace_invitations`).first<{ token_hash: string }>()
    expect(raw!.token_hash).not.toContain(inv.body.token)
    // invitation alone grants nothing
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(404)
    const acc = await t.call('POST', '/invitations/accept', 'bob', { token: inv.body.token })
    expect(acc.status).toBe(200)
    expect(acc.body.role).toBe('venture_operator')
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(200)
    // single-use: second use (even by another user) fails with the same generic error
    const again = await t.call('POST', '/invitations/accept', 'carol', { token: inv.body.token })
    expect(again.status).toBe(404)
    const audit = await t.call('GET', `/workspaces/${wid}/audit`, 'alice')
    const actions = audit.body.events.map((e: { action: string }) => e.action)
    expect(actions).toContain('invitation.created')
    expect(actions).toContain('invitation.accepted')
  })

  it('revoked, expired and malformed tokens are rejected identically', async () => {
    const t = setup()
    const { wid } = await bootstrap(t)
    const a = await invite(t, wid, { role: 'viewer' })
    expect((await t.call('POST', `/workspaces/${wid}/invitations/${a.body.invitation.id}/revoke`, 'alice')).status).toBe(200)
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: a.body.token })).status).toBe(404)
    const b = await invite(t, wid, { role: 'viewer' })
    await t.db.prepare(`UPDATE workspace_invitations SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?`).bind(b.body.invitation.id).run()
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: b.body.token })).status).toBe(404)
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: 'inv_' + '0'.repeat(64) })).status).toBe(404)
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: 'garbage' })).status).toBe(400)
    // decided invitations are immutable at the DB level
    await expect(t.db.prepare(`UPDATE workspace_invitations SET status = 'pending' WHERE id = ?`).bind(a.body.invitation.id).run()).rejects.toThrow()
    await expect(t.db.prepare(`DELETE FROM workspace_invitations`).run()).rejects.toThrow()
  })

  it('only admins can invite, change roles, revoke or remove others', async () => {
    const t = setup()
    const { wid } = await bootstrap(t)
    const bobId = await grant(t, 'bob', wid, 'governance_approver')
    expect((await invite(t, wid, { role: 'viewer' }, 'bob')).status).toBe(403)
    expect((await t.call('PUT', `/workspaces/${wid}/members/${bobId}`, 'bob', { role: 'workspace_admin', reason: 'self-promotion' })).status).toBe(403)
    const list = await t.call('GET', `/workspaces/${wid}/members`, 'bob')
    expect(list.status).toBe(200)
    expect(list.body.invitations).toEqual([]) // non-admins never see invitation metadata
    expect((await invite(t, wid, { role: 'viewer', venture_id: 'ven_not_here' })).status).toBe(400)
  })

  it('role change and offboarding are audited; last admin is protected; offboarding ends venture access', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    const aliceId = (await t.call('GET', '/session', 'alice')).body.principal.person_id
    const bobId = await grant(t, 'bob', wid, 'venture_operator', vid)
    // last admin cannot be demoted or leave
    expect((await t.call('PUT', `/workspaces/${wid}/members/${aliceId}`, 'alice', { role: 'viewer', reason: 'demote self' })).status).toBe(409)
    expect((await t.call('POST', `/workspaces/${wid}/members/${aliceId}/offboard`, 'alice', { reason: 'leaving' })).status).toBe(409)
    // role change
    const ch = await t.call('PUT', `/workspaces/${wid}/members/${bobId}`, 'alice', { role: 'viewer', reason: 'scope reduced' })
    expect(ch.body).toMatchObject({ role: 'viewer', changed: true })
    // offboard → loses workspace and venture access
    expect((await t.call('POST', `/workspaces/${wid}/members/${bobId}/offboard`, 'alice', { reason: 'project ended' })).status).toBe(200)
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(404)
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(404)
    const vm = await t.db.prepare(`SELECT status FROM venture_members WHERE person_id = ?`).bind(bobId).first<{ status: string }>()
    expect(vm!.status).toBe('ended')
    const actions = (await t.call('GET', `/workspaces/${wid}/audit`, 'alice')).body.events.map((e: { action: string }) => e.action)
    expect(actions).toContain('member.role_changed')
    expect(actions).toContain('member.offboarded')
  })

  it('a member may leave voluntarily; a re-invite reactivates them', async () => {
    const t = setup()
    const { wid } = await bootstrap(t)
    const bobId = await grant(t, 'bob', wid, 'viewer')
    expect((await t.call('POST', `/workspaces/${wid}/members/${bobId}/offboard`, 'bob', { reason: 'my choice' })).status).toBe(200)
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(404)
    const inv = await invite(t, wid, { role: 'viewer' })
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: inv.body.token })).status).toBe(200)
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(200)
    // already active → conflict on another invite
    const inv2 = await invite(t, wid, { role: 'viewer' })
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: inv2.body.token })).status).toBe(409)
  })
})
