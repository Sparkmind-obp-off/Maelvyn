import { describe, expect, it } from 'vitest'
import { bootstrap, grant, setup } from './helpers'

const inv = (t: ReturnType<typeof setup>, wid: string, body: Record<string, unknown>, user = 'owner') => t.call('POST', `/workspaces/${wid}/invitations`, user, body)

describe('workspace membership lifecycle (owner-only administration)', () => {
  it('invite bound to verified email → explicit acceptance grants role; venture access is NOT included', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    const r = await inv(t, wid, { role: 'venture_operator', invitee_email: 'bob@example.test', reason: 'synthetic test' })
    expect(r.status).toBe(201)
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(404)
    expect((await t.call('POST', '/invitations/accept', 'carol', { token: r.body.token })).status).toBe(403) // wrong email
    const acc = await t.call('POST', '/invitations/accept', 'bob', { token: r.body.token })
    expect(acc.status).toBe(200)
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(200)
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(404) // no venture access by implication
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: r.body.token })).status).toBe(404) // single use
  })

  it('invitations cannot grant workspace_admin or carry venture access; unverified email cannot accept', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    expect((await inv(t, wid, { role: 'workspace_admin', invitee_email: 'x@example.test', reason: 'nope' })).status).toBe(400)
    expect((await inv(t, wid, { role: 'viewer', invitee_email: 'x@example.test', reason: 'nope', venture_id: vid })).status).toBe(400)
    const r = await inv(t, wid, { role: 'viewer', invitee_email: 'unverified-u@example.test', reason: 'test' })
    expect((await t.call('POST', '/invitations/accept', 'unverified-u', { token: r.body.token })).status).toBe(403)
  })

  it('revoked/expired/malformed tokens rejected; decided invitations immutable', async () => {
    const t = setup()
    const { wid } = await bootstrap(t)
    const a = await inv(t, wid, { role: 'viewer', invitee_email: 'bob@example.test', reason: 'first reason' })
    await t.call('POST', `/workspaces/${wid}/invitations/${a.body.invitation.id}/revoke`, 'owner')
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: a.body.token })).status).toBe(404)
    const b = await inv(t, wid, { role: 'viewer', invitee_email: 'bob@example.test', reason: 'second reason' })
    await t.db.prepare(`UPDATE workspace_invitations SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?`).bind(b.body.invitation.id).run()
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: b.body.token })).status).toBe(404)
    expect((await t.call('POST', '/invitations/accept', 'bob', { token: 'garbage' })).status).toBe(400)
    await expect(t.db.prepare(`UPDATE workspace_invitations SET status = 'pending' WHERE id = ?`).bind(a.body.invitation.id).run()).rejects.toThrow()
  })

  it('only the owner manages members; owner cannot be demoted/removed via ordinary routes', async () => {
    const t = setup()
    const { wid } = await bootstrap(t)
    const ownerId = (await t.call('GET', '/session', 'owner')).body.principal.person_id
    const bobId = await grant(t, 'bob', wid, 'governance_approver')
    expect((await inv(t, wid, { role: 'viewer', invitee_email: 'z@example.test', reason: 'x' }, 'bob')).status).toBe(403)
    expect((await t.call('PUT', `/workspaces/${wid}/members/${bobId}`, 'bob', { role: 'governance_approver', reason: 'self' })).status).toBe(403)
    expect((await t.call('PUT', `/workspaces/${wid}/members/${ownerId}`, 'owner', { role: 'viewer', reason: 'demote' })).status).toBe(403)
    expect((await t.call('POST', `/workspaces/${wid}/members/${ownerId}/offboard`, 'owner', { reason: 'leave' })).status).toBe(403)
    expect((await t.call('PUT', `/workspaces/${wid}/members/${bobId}`, 'owner', { role: 'viewer', reason: 'scope reduced' })).body.changed).toBe(true)
    expect((await t.call('POST', `/workspaces/${wid}/members/${bobId}/offboard`, 'owner', { reason: 'ended' })).status).toBe(200)
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(404)
  })

  it('venture assignment is proposed then accepted only by the assignee; ending it removes access', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    const bobId = await grant(t, 'bob', wid, 'venture_operator')
    const a = await t.call('POST', `/ventures/${vid}/assignments`, 'owner', { person_id: bobId, role_label: 'contributor', reason: 'synthetic test' })
    expect(a.body.assignment.status).toBe('proposed')
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(404) // proposed ≠ access
    expect((await t.call('POST', `/me/assignments/${a.body.assignment.id}/respond`, 'carol', { decision: 'accept' })).status).toBe(404)
    expect((await t.call('POST', `/me/assignments/${a.body.assignment.id}/respond`, 'bob', { decision: 'accept' })).body.status).toBe('active')
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(200)
    expect((await t.call('POST', `/ventures/${vid}/assignments/${a.body.assignment.id}/end`, 'bob', { reason: 'my choice' })).status).toBe(200)
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(404)
  })
})
