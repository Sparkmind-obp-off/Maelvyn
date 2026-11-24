import { describe, expect, it } from 'vitest'
import { bootstrap, grant, setup } from './helpers'

describe('MAELVYN Connect', () => {
  it('keeps the manifest private and rejects unauthenticated access', async () => {
    const t = setup()
    const unauthenticated = await t.call('GET', '/connect/manifest')
    expect(unauthenticated.status).toBe(401)
    const authenticated = await t.call('GET', '/connect/manifest', 'owner')
    expect(authenticated.status).toBe(200)
    expect(authenticated.body.mode).toBe('read_only_by_default')
    expect(authenticated.body.authentication).toContain('Bearer')
  })

  it('returns a scoped registry without secret references', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    const result = await t.call('GET', `/connect/registry?workspace_id=${wid}`, 'owner')
    expect(result.status).toBe(200)
    expect(result.body.workspace.id).toBe(wid)
    expect(result.body.projects.some((v: { id: string }) => v.id === vid)).toBe(true)
    expect(result.body.providers.length).toBeGreaterThan(0)
    expect(JSON.stringify(result.body)).not.toContain('TAVILY_API_KEY')
    expect(result.body.docs.some((d: { id: string }) => d.id === 'connect')).toBe(true)
  })

  it('allows read access by membership but scopes writes to venture management', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    await grant(t, 'viewer', wid, 'viewer', vid)
    const read = await t.call('GET', `/connect/registry?workspace_id=${wid}&include=projects,tasks`, 'viewer')
    expect(read.status).toBe(200)
    const write = await t.call('POST', '/connect/status-proposals', 'viewer', {
      workspace_id: wid,
      venture_id: vid,
      title: 'Review validation evidence',
      requested_status: 'needs_review',
      source: 'api',
    })
    expect(write.status).toBe(403)
  })

  it('records a human-reviewable, auditable status proposal without mutating the task', async () => {
    const t = setup()
    const { wid, vid } = await bootstrap(t)
    const write = await t.call('POST', '/connect/status-proposals', 'owner', {
      workspace_id: wid,
      venture_id: vid,
      title: 'Review validation evidence',
      requested_status: 'needs_review',
      note: 'Evidence package is ready for a human decision.',
      source: 'mcp',
    })
    expect(write.status).toBe(201)
    expect(write.body.review_required).toBe(true)
    expect(write.body.proposal.status).toBe('pending')
    const proposals = await t.call('GET', `/connect/status-proposals?workspace_id=${wid}`, 'owner')
    expect(proposals.status).toBe(200)
    expect(proposals.body.proposals).toHaveLength(1)
    expect(proposals.body.proposals[0].requested_status).toBe('needs_review')
    const audit = await t.db.prepare(`SELECT action, target_type FROM audit_events WHERE action = 'connect.status_proposal.created'`).all<{ action: string; target_type: string }>()
    expect(audit.results).toHaveLength(1)
    expect(audit.results[0]).toEqual({ action: 'connect.status_proposal.created', target_type: 'connect_status_proposal' })
  })
})
