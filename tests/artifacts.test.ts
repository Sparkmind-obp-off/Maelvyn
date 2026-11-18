import { describe, expect, it } from 'vitest'
import { ARTIFACT_MAX_BYTES, sanitizeFilename } from '../server/artifacts/routes'
import type { Env } from '../server/env'
import { bootstrap, grant, setup } from './helpers'

/** In-memory stand-in for the private R2 bucket (only the methods the Worker uses). */
export function memoryBucket() {
  const store = new Map<string, { bytes: Uint8Array; contentType?: string }>()
  const bucket = {
    store,
    async put(key: string, value: Uint8Array, opts?: { httpMetadata?: { contentType?: string } }) { store.set(key, { bytes: new Uint8Array(value), contentType: opts?.httpMetadata?.contentType }); return {} },
    async get(key: string) {
      const o = store.get(key)
      if (!o) return null
      return { body: new Response(o.bytes).body, httpMetadata: { contentType: o.contentType } }
    },
    async delete(key: string) { store.delete(key) },
  }
  return bucket
}

const PDF = new TextEncoder().encode('%PDF-1.7\nsynthetic test document\n%%EOF')
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

function artifactSetup() {
  const bucket = memoryBucket()
  const t = setup({ env: { ARTIFACTS: bucket as unknown as Env['ARTIFACTS'] } })
  async function upload(vid: string, user: string, body: Uint8Array, contentType = 'application/pdf', filename = 'brief.pdf') {
    const res = await t.app.request(`/api/v1/ventures/${vid}/artifacts`, {
      method: 'POST', body, headers: { Authorization: `Bearer tok:${user}`, 'Content-Type': contentType, 'X-Filename': filename },
    }, t.env)
    return { status: res.status, body: (await res.json()) as Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  async function raw(path: string, user?: string, method = 'GET') {
    return t.app.request(`/api/v1${path}`, { method, headers: user ? { Authorization: `Bearer tok:${user}` } : {} }, t.env)
  }
  return { ...t, bucket, upload, raw }
}

describe('private R2 artifacts', () => {
  it('uploads to a random, scoped, never-exposed object key and audits it', async () => {
    const t = artifactSetup()
    const { wid, vid } = await bootstrap(t)
    const r = await t.upload(vid, 'owner', PDF)
    expect(r.status).toBe(201)
    expect(r.body.artifact).toMatchObject({ content_type: 'application/pdf', size_bytes: PDF.byteLength })
    expect(JSON.stringify(r.body)).not.toContain('ws/')
    const [key] = [...t.bucket.store.keys()]
    expect(key).toMatch(new RegExp(`^ws/${wid}/ven/${vid}/[a-f0-9]{64}$`))
    const ev = await t.db.prepare(`SELECT COUNT(*) AS n FROM audit_events WHERE action = 'artifact.uploaded' AND target_id = ?`).bind(r.body.artifact.id).first<{ n: number }>()
    expect(ev!.n).toBe(1)
  })

  it('enforces content-type allowlist, magic-byte match, empty and size limits', async () => {
    const t = artifactSetup()
    const { vid } = await bootstrap(t)
    expect((await t.upload(vid, 'owner', PDF, 'text/html')).status).toBe(400)
    expect((await t.upload(vid, 'owner', PDF, 'image/png')).status).toBe(400) // PDF bytes declared as PNG
    expect((await t.upload(vid, 'owner', PNG, 'application/pdf')).status).toBe(400)
    expect((await t.upload(vid, 'owner', new Uint8Array([0, 1, 2, 3]), 'text/plain')).status).toBe(400) // binary as text
    expect((await t.upload(vid, 'owner', new Uint8Array(0))).status).toBe(400)
    const big = new Uint8Array(ARTIFACT_MAX_BYTES + 1); big.set(PDF)
    expect((await t.upload(vid, 'owner', big)).status).toBe(400)
    expect((await t.upload(vid, 'owner', PNG, 'image/png', 'ok.png')).status).toBe(201)
    expect(t.bucket.store.size).toBe(1)
  })

  it('sanitizes filenames (path traversal, control chars, quotes)', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('_.._etc_passwd')
    expect(sanitizeFilename('a"b\r\n.pdf')).toBe('a_b.pdf')
    expect(sanitizeFilename(undefined)).toBe('artifact')
  })

  it('streams to authorized members only; unauthenticated, outsiders and cross-venture are denied', async () => {
    const t = artifactSetup()
    const { wid, vid } = await bootstrap(t)
    const other = await t.call('POST', `/workspaces/${wid}/ventures`, 'owner', { name: 'Other Venture', code: 'OTH-01', category: 'commerce' })
    const otherVid = other.body.venture.id as string
    const a = (await t.upload(vid, 'owner', PDF)).body.artifact.id as string
    const b = (await t.upload(otherVid, 'owner', PDF)).body.artifact.id as string
    await grant(t, 'bob', wid, 'venture_operator', vid)

    const okRes = await t.raw(`/artifacts/${a}/content`, 'bob')
    expect(okRes.status).toBe(200)
    expect(okRes.headers.get('Content-Disposition')).toContain('attachment')
    expect(okRes.headers.get('Cache-Control')).toContain('no-store')
    expect(new Uint8Array(await okRes.arrayBuffer())).toEqual(PDF)

    expect((await t.raw(`/artifacts/${a}/content`)).status).toBe(401)
    expect((await t.raw(`/artifacts/${a}/content`, 'mallory')).status).toBe(404)
    expect((await t.raw(`/artifacts/${b}/content`, 'bob')).status).toBe(404) // cross-venture
    expect((await t.call('GET', `/ventures/${otherVid}/artifacts`, 'bob')).status).toBe(404)
    expect((await t.call('POST', `/artifacts/${b}/delivery`, 'bob')).status).toBe(404)
    expect((await t.upload(otherVid, 'bob', PDF)).status).toBe(404)
  })

  it('viewer may read but not upload or delete', async () => {
    const t = artifactSetup()
    const { wid, vid } = await bootstrap(t)
    const a = (await t.upload(vid, 'owner', PDF)).body.artifact.id as string
    await grant(t, 'vic', wid, 'viewer', vid)
    expect((await t.raw(`/artifacts/${a}/content`, 'vic')).status).toBe(200)
    expect((await t.upload(vid, 'vic', PDF)).status).toBe(403)
    expect((await t.raw(`/artifacts/${a}`, 'vic', 'DELETE')).status).toBe(403)
  })

  it('delivery tokens are single-use, expire, and are re-authorized at redemption', async () => {
    const t = artifactSetup()
    const { wid, vid } = await bootstrap(t)
    const a = (await t.upload(vid, 'owner', PDF)).body.artifact.id as string
    await grant(t, 'bob', wid, 'venture_operator', vid)

    const d1 = await t.call('POST', `/artifacts/${a}/delivery`, 'bob')
    expect(d1.status).toBe(201)
    expect(d1.body.single_use).toBe(true)
    const path1 = String(d1.body.url).replace('/api/v1', '')
    expect((await t.raw(path1)).status).toBe(200) // no bearer needed
    expect((await t.raw(path1)).status).toBe(404) // replay denied

    // expired
    const d2 = await t.call('POST', `/artifacts/${a}/delivery`, 'bob')
    await t.db.prepare(`UPDATE artifact_delivery_tokens SET expires_at = '2000-01-01T00:00:00.000Z' WHERE used_at IS NULL`).run()
    expect((await t.raw(String(d2.body.url).replace('/api/v1', ''))).status).toBe(404)

    // membership revoked after issue
    const d3 = await t.call('POST', `/artifacts/${a}/delivery`, 'bob')
    await t.db.prepare(`UPDATE workspace_members SET status = 'suspended' WHERE id = ?`).bind(`wsm_bob_${wid}`).run()
    expect((await t.raw(String(d3.body.url).replace('/api/v1', ''))).status).toBe(404)

    // malformed / unknown tokens
    expect((await t.raw('/artifacts/delivery/not-a-token')).status).toBe(404)
    expect((await t.raw(`/artifacts/delivery/${'a'.repeat(64)}`)).status).toBe(404)

    // tokens are stored hashed only
    const leaked = await t.db.prepare(`SELECT COUNT(*) AS n FROM artifact_delivery_tokens WHERE token_hash = ?`).bind(String(d1.body.url).split('/').pop()).first<{ n: number }>()
    expect(leaked!.n).toBe(0)
  })

  it('delete removes the object, revokes links, keeps an audited tombstone that cannot be restored', async () => {
    const t = artifactSetup()
    const { vid } = await bootstrap(t)
    const a = (await t.upload(vid, 'owner', PDF)).body.artifact.id as string
    const link = await t.call('POST', `/artifacts/${a}/delivery`, 'owner')
    expect((await t.raw(`/artifacts/${a}`, 'owner', 'DELETE')).status).toBe(200)
    expect(t.bucket.store.size).toBe(0)
    expect((await t.raw(`/artifacts/${a}/content`, 'owner')).status).toBe(404)
    expect((await t.raw(String(link.body.url).replace('/api/v1', ''))).status).toBe(404)
    expect((await t.call('GET', `/ventures/${vid}/artifacts`, 'owner')).body.artifacts).toEqual([])
    const row = await t.db.prepare(`SELECT status, deleted_at FROM artifacts WHERE id = ?`).bind(a).first<{ status: string; deleted_at: string }>()
    expect(row!.status).toBe('deleted')
    await expect(t.db.prepare(`UPDATE artifacts SET status = 'active' WHERE id = ?`).bind(a).run()).rejects.toThrow()
    await expect(t.db.prepare(`DELETE FROM artifacts WHERE id = ?`).bind(a).run()).rejects.toThrow()
    await expect(t.db.prepare(`UPDATE artifacts SET venture_id = 'x' WHERE id = ?`).bind(a).run()).rejects.toThrow()
    const actions = (await t.db.prepare(`SELECT action FROM audit_events WHERE target_id = ? ORDER BY rowid`).bind(a).all<{ action: string }>()).results.map((r) => r.action)
    expect(actions).toEqual(['artifact.uploaded', 'artifact.delivery_issued', 'artifact.deleted'])
  })

  it('fails closed when the bucket is not bound', async () => {
    const t = setup()
    const { vid } = await bootstrap(t)
    const res = await t.app.request(`/api/v1/ventures/${vid}/artifacts`, { method: 'POST', body: PDF, headers: { Authorization: 'Bearer tok:owner', 'Content-Type': 'application/pdf' } }, t.env)
    expect(res.status).toBe(412)
  })
})
