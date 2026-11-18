import { describe, expect, it } from 'vitest'
import { bootstrap, grant, setup } from './helpers'

describe('health & readiness', () => {
  it('health is public and ready reports applied migrations', async () => {
    const t = setup()
    expect((await t.call('GET', '/health')).status).toBe(200)
    const r = await t.call('GET', '/ready')
    expect(r.status).toBe(200)
    expect(r.body.checks).toMatchObject({ database: 'ok', schema: 'ok', migrations: 'ok', identity: 'configured' })
  })
  it('config never exposes secrets', async () => {
    const t = setup({ env: { CLERK_SECRET_KEY: 'sk_test_SHOULDNOTLEAK' } })
    const r = await t.call('GET', '/config')
    expect(JSON.stringify(r.body)).not.toContain('sk_test')
    expect(JSON.stringify(r.body)).not.toContain('tvly-')
    expect(r.body.identity_instance).toBe('clerk-development')
  })
})

describe('authentication', () => {
  it('rejects missing and invalid tokens', async () => {
    const t = setup()
    expect((await t.call('GET', '/session')).status).toBe(401)
    const bad = await t.app.request('/api/v1/session', { headers: { Authorization: 'Bearer forged.jwt.value' } }, t.env)
    expect(bad.status).toBe(401)
    expect(((await bad.json()) as { error: { code: string } }).error.code).toBe('UNAUTHENTICATED')
  })
  it('first sign-in provisions a person but grants no memberships', async () => {
    const t = setup()
    const r = await t.call('GET', '/session', 'newbie')
    expect(r.status).toBe(200)
    expect(r.body.memberships).toEqual([])
  })
})

describe('authorization & venture isolation', () => {
  it('denies a signed-in non-member access to a workspace (indistinguishable from not found)', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t, 'owner')
    expect((await t.call('GET', `/workspaces/${wid}`, 'mallory')).status).toBe(404)
    expect((await t.call('GET', `/ventures/${vid}`, 'mallory')).status).toBe(404)
    expect((await t.call('GET', `/workspaces/${wid}/audit`, 'mallory')).status).toBe(404)
    const denied = await t.db.prepare(`SELECT COUNT(*) AS n FROM permission_decisions WHERE decision = 'deny'`).first<{ n: number }>()
    expect(denied!.n).toBeGreaterThanOrEqual(3)
  })

  it('venture operator in the same workspace cannot read another venture (cross-venture denied)', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t, 'owner')
    const other = await t.call('POST', `/workspaces/${wid}/ventures`, 'owner', { name: 'Other Venture', code: 'OTH-01', category: 'commerce' })
    await grant(t, 'bob', wid, 'venture_operator', vid)
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(200)
    expect((await t.call('GET', `/ventures/${other.body.venture.id}`, 'bob')).status).toBe(404)
    const list = await t.call('GET', `/workspaces/${wid}/ventures`, 'bob')
    expect(list.body.ventures.map((v: { id: string }) => v.id)).toEqual([vid])
    // and cannot run research on it
    const r = await t.call('POST', `/ventures/${other.body.venture.id}/research`, 'bob', { objective: 'Synthetic cross venture probe' }, { 'Idempotency-Key': 'idem-cross-0001' })
    expect(r.status).toBe(404)
  })

  it('viewer cannot create ventures, run research, manage providers or read audit', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t, 'owner')
    await grant(t, 'vic', wid, 'viewer', vid)
    expect((await t.call('POST', `/workspaces/${wid}/ventures`, 'vic', { name: 'Nope', code: 'NO-01', category: 'other' })).status).toBe(403)
    expect((await t.call('POST', `/ventures/${vid}/research`, 'vic', { objective: 'Synthetic viewer probe' }, { 'Idempotency-Key': 'idem-viewer-001' })).status).toBe(403)
    expect((await t.call('PUT', `/workspaces/${wid}/providers/tavily`, 'vic', { live_enabled: true, daily_credit_cap: 5, per_task_credit_cap: 2 })).status).toBe(403)
    expect((await t.call('GET', `/workspaces/${wid}/audit`, 'vic')).status).toBe(403)
  })

  it('client-forged role/workspace fields are ignored (roles come from the database)', async () => {
    const t = setup()
    const { wid } = await bootstrap(t, 'owner')
    await grant(t, 'vic', wid, 'viewer')
    const r = await t.call('PUT', `/workspaces/${wid}/providers/tavily`, 'vic', { live_enabled: true, daily_credit_cap: 5, per_task_credit_cap: 2, role: 'workspace_admin' }, { 'X-Role': 'workspace_admin' })
    expect(r.status).toBe(403)
  })

  it('suspended membership loses access', async () => {
    const t = setup()
    const { wid } = await bootstrap(t, 'owner')
    await grant(t, 'bob', wid, 'governance_approver')
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(200)
    await t.db.prepare(`UPDATE workspace_members SET status = 'suspended' WHERE id = ?`).bind(`wsm_bob_${wid}`).run()
    expect((await t.call('GET', `/workspaces/${wid}`, 'bob')).status).toBe(404)
  })

  it('self-service workspace creation is disabled in production', async () => {
    const t = setup({ env: { APP_ENV: 'production' } })
    expect((await t.call('POST', '/workspaces', 'owner', { name: 'Prod attempt' })).status).toBe(403)
  })
})
