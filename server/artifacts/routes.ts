import type { Context, Hono } from 'hono'
import { auditStatement } from '../audit/audit'
import { authorizeVenture } from '../authorization/policy'
import type { AppEnv, Principal } from '../env'
import { AppError, newId, nowIso, ok, sha256Hex } from '../lib/http'
import { rateLimit } from '../lib/ratelimit'
import { principalOf } from '../lib/request'

/**
 * Private artifact storage on the R2 bucket bound as ARTIFACTS.
 * - The bucket is never public; bytes are only served by this Worker after authorization.
 * - Object keys are random, scoped by workspace/venture, and never returned to clients.
 * - Downloads: authenticated streaming, or a short-lived, single-use, person-bound delivery token
 *   that re-checks authorization at redemption time.
 * - Every upload, token issue, download and delete is audited; denials are recorded by the policy layer.
 */
export const ARTIFACT_MAX_BYTES = 10 * 1024 * 1024
export const DELIVERY_TOKEN_TTL_SECONDS = 300

const ALLOWED_TYPES: Record<string, ((b: Uint8Array) => boolean) | null> = {
  'application/pdf': (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]), // %PDF-
  'image/png': (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/jpeg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  'image/webp': (b) => startsWith(b, [0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  'text/plain': null,
  'text/csv': null,
  'application/json': null,
}
const TEXT_TYPES = new Set(['text/plain', 'text/csv', 'application/json'])

function startsWith(b: Uint8Array, sig: number[]) { return b.length >= sig.length && sig.every((v, i) => b[i] === v) }

function looksLikeText(b: Uint8Array) {
  const sample = b.subarray(0, 8192)
  if (sample.includes(0)) return false
  try { new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(sample.length < b.length ? sample.subarray(0, lastUtf8Boundary(sample)) : sample); return true } catch { return false }
}
function lastUtf8Boundary(b: Uint8Array) { let i = b.length; while (i > 0 && (b[i - 1]! & 0xc0) === 0x80) i--; return i > 0 && b[i - 1]! >= 0xc0 ? i - 1 : b.length }

export function sanitizeFilename(raw: string | undefined): string {
  let name = raw ?? ''
  try { name = decodeURIComponent(name) } catch { /* keep raw */ }
  // eslint-disable-next-line no-control-regex
  name = name.replace(/[\u0000-\u001F\u007F]/g, '').replace(/[\\/]/g, '_').replace(/["<>|:*?]/g, '_').trim()
  name = name.replace(/^\.+/, '').slice(0, 120)
  return name || 'artifact'
}

function storage(c: Context<AppEnv>) {
  if (!c.env.ARTIFACTS) throw new AppError('PROVIDER_NOT_CONFIGURED', 'Private artifact storage is not configured in this environment.')
  return c.env.ARTIFACTS
}

function randomHex(bytes: number) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a)
  return Array.from(a, (x) => x.toString(16).padStart(2, '0')).join('')
}

type ArtifactRow = { id: string; workspace_id: string; venture_id: string; object_key: string; filename: string; content_type: string; size_bytes: number; sha256: string; status: string }

async function loadArtifact(c: Context<AppEnv>, p: Principal, aid: string, action: 'artifact.read' | 'artifact.delete') {
  const a = await c.env.DB.prepare(`SELECT id, workspace_id, venture_id, object_key, filename, content_type, size_bytes, sha256, status FROM artifacts WHERE id = ?`).bind(aid).first<ArtifactRow>()
  if (!a || a.status !== 'active') throw new AppError('NOT_FOUND', 'Artifact not found.')
  try {
    const access = await authorizeVenture(c.env, p, a.venture_id, action, c.get('requestId'))
    return { a, access }
  } catch (e) {
    if (e instanceof AppError && e.code === 'NOT_FOUND') throw new AppError('NOT_FOUND', 'Artifact not found.')
    throw e
  }
}

async function streamArtifact(c: Context<AppEnv>, a: ArtifactRow) {
  const obj = await storage(c).get(a.object_key)
  if (!obj) throw new AppError('NOT_FOUND', 'Artifact not found.')
  const safe = a.filename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '_')
  return new Response(obj.body as unknown as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': a.content_type,
      'Content-Length': String(a.size_bytes),
      'Content-Disposition': `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(a.filename)}`,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'X-Request-Id': c.get('requestId'),
    },
  })
}

/** Public route (no bearer): redeems a single-use delivery token. Must be registered BEFORE the auth middleware. */
export function registerArtifactDelivery(app: Hono<AppEnv>) {
  app.get('/artifacts/delivery/:token', async (c) => {
    const token = c.req.param('token')
    if (!/^[a-f0-9]{64}$/.test(token)) throw new AppError('NOT_FOUND', 'Delivery link is invalid or expired.')
    const now = nowIso()
    const t = await c.env.DB.prepare(
      `UPDATE artifact_delivery_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING artifact_id, issued_to_person_id`,
    ).bind(now, await sha256Hex(token), now).first<{ artifact_id: string; issued_to_person_id: string }>()
    if (!t) throw new AppError('NOT_FOUND', 'Delivery link is invalid or expired.')
    const person = await c.env.DB.prepare(`SELECT id, display_name, contact_email, email_verified, status FROM people WHERE id = ?`).bind(t.issued_to_person_id)
      .first<{ id: string; display_name: string; contact_email: string | null; email_verified: number; status: string }>()
    if (!person || person.status !== 'active') throw new AppError('NOT_FOUND', 'Delivery link is invalid or expired.')
    const principal: Principal = { personId: person.id, subject: '', displayName: person.display_name, email: person.contact_email, emailVerified: person.email_verified === 1 }
    // Re-authorize at redemption: revoked memberships invalidate outstanding links.
    let loaded
    try { loaded = await loadArtifact(c, principal, t.artifact_id, 'artifact.read') } catch { throw new AppError('NOT_FOUND', 'Delivery link is invalid or expired.') }
    await auditStatement(c.env, { workspaceId: loaded.a.workspace_id, ventureId: loaded.a.venture_id, actorPersonId: person.id, action: 'artifact.downloaded', targetType: 'artifact', targetId: loaded.a.id, requestId: c.get('requestId'), metadata: { via: 'delivery_token' } }).run()
    return streamArtifact(c, loaded.a)
  })
}

export function registerArtifactRoutes(app: Hono<AppEnv>) {
  app.post('/ventures/:vid/artifacts', async (c) => {
    const p = principalOf(c)
    const access = await authorizeVenture(c.env, p, c.req.param('vid'), 'artifact.write', c.get('requestId'))
    const bucket = storage(c)
    await rateLimit(c.env, `artifact-upload:${p.personId}`, 20)
    const contentType = (c.req.header('Content-Type') ?? '').split(';')[0]!.trim().toLowerCase()
    if (!(contentType in ALLOWED_TYPES)) throw new AppError('VALIDATION_ERROR', 'Unsupported content type.', { allowed: Object.keys(ALLOWED_TYPES) })
    const declared = Number(c.req.header('Content-Length') ?? 'NaN')
    if (Number.isFinite(declared) && declared > ARTIFACT_MAX_BYTES) throw new AppError('VALIDATION_ERROR', `File exceeds the ${ARTIFACT_MAX_BYTES} byte limit.`)
    const bytes = new Uint8Array(await c.req.arrayBuffer())
    if (bytes.byteLength === 0) throw new AppError('VALIDATION_ERROR', 'File is empty.')
    if (bytes.byteLength > ARTIFACT_MAX_BYTES) throw new AppError('VALIDATION_ERROR', `File exceeds the ${ARTIFACT_MAX_BYTES} byte limit.`)
    const sniff = ALLOWED_TYPES[contentType]
    if (sniff ? !sniff(bytes) : TEXT_TYPES.has(contentType) && !looksLikeText(bytes)) throw new AppError('VALIDATION_ERROR', 'File content does not match the declared content type.')
    const filename = sanitizeFilename(c.req.header('X-Filename'))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
    const id = newId('art')
    const objectKey = `ws/${access.workspaceId}/ven/${access.ventureId}/${randomHex(32)}`
    await bucket.put(objectKey, bytes, { httpMetadata: { contentType }, customMetadata: { artifact_id: id, sha256 } })
    try {
      await c.env.DB.batch([
        c.env.DB.prepare(`INSERT INTO artifacts (id, workspace_id, venture_id, object_key, filename, content_type, size_bytes, sha256, status, uploaded_by_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`)
          .bind(id, access.workspaceId, access.ventureId, objectKey, filename, contentType, bytes.byteLength, sha256, p.personId, nowIso()),
        auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'artifact.uploaded', targetType: 'artifact', targetId: id, requestId: c.get('requestId'), metadata: { content_type: contentType, size_bytes: bytes.byteLength, sha256 } }),
      ])
    } catch (e) {
      await bucket.delete(objectKey) // never leave orphaned bytes without a metadata/audit record
      throw e
    }
    return ok(c, { artifact: { id, filename, content_type: contentType, size_bytes: bytes.byteLength, sha256 } }, 201)
  })

  app.get('/ventures/:vid/artifacts', async (c) => {
    const p = principalOf(c)
    const access = await authorizeVenture(c.env, p, c.req.param('vid'), 'artifact.read', c.get('requestId'))
    const rows = (await c.env.DB.prepare(
      `SELECT id, filename, content_type, size_bytes, sha256, uploaded_by_person_id, created_at FROM artifacts WHERE venture_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 200`,
    ).bind(access.ventureId).all()).results
    return ok(c, { artifacts: rows })
  })

  app.get('/artifacts/:aid/content', async (c) => {
    const p = principalOf(c)
    const { a } = await loadArtifact(c, p, c.req.param('aid'), 'artifact.read')
    await auditStatement(c.env, { workspaceId: a.workspace_id, ventureId: a.venture_id, actorPersonId: p.personId, action: 'artifact.downloaded', targetType: 'artifact', targetId: a.id, requestId: c.get('requestId'), metadata: { via: 'authenticated_stream' } }).run()
    return streamArtifact(c, a)
  })

  app.post('/artifacts/:aid/delivery', async (c) => {
    const p = principalOf(c)
    const { a } = await loadArtifact(c, p, c.req.param('aid'), 'artifact.read')
    await rateLimit(c.env, `artifact-delivery:${p.personId}`, 30)
    const token = randomHex(32)
    const expiresAt = new Date(Date.now() + DELIVERY_TOKEN_TTL_SECONDS * 1000).toISOString()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO artifact_delivery_tokens (token_hash, artifact_id, issued_to_person_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
        .bind(await sha256Hex(token), a.id, p.personId, expiresAt, nowIso()),
      auditStatement(c.env, { workspaceId: a.workspace_id, ventureId: a.venture_id, actorPersonId: p.personId, action: 'artifact.delivery_issued', targetType: 'artifact', targetId: a.id, requestId: c.get('requestId'), metadata: { expires_at: expiresAt } }),
    ])
    return ok(c, { url: `/api/v1/artifacts/delivery/${token}`, expires_at: expiresAt, single_use: true }, 201)
  })

  app.delete('/artifacts/:aid', async (c) => {
    const p = principalOf(c)
    const { a } = await loadArtifact(c, p, c.req.param('aid'), 'artifact.delete')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE artifacts SET status = 'deleted', deleted_by_person_id = ?, deleted_at = ? WHERE id = ? AND status = 'active'`).bind(p.personId, ts, a.id),
      c.env.DB.prepare(`UPDATE artifact_delivery_tokens SET used_at = COALESCE(used_at, ?) WHERE artifact_id = ?`).bind(ts, a.id),
      auditStatement(c.env, { workspaceId: a.workspace_id, ventureId: a.venture_id, actorPersonId: p.personId, action: 'artifact.deleted', targetType: 'artifact', targetId: a.id, requestId: c.get('requestId'), metadata: { sha256: a.sha256 } }),
    ])
    await storage(c).delete(a.object_key)
    return ok(c, { deleted: true, id: a.id })
  })
}
