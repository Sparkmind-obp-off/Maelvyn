import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose'
import { verifyClerkToken } from '../server/identity/clerk'
import type { Env } from '../server/env'
import { setup } from './helpers'

/**
 * Production release gates (docs/GENSPARK-WRANGLER-EXECUTION-MASTER-PROMPT.md, Phase C).
 * Real JWT signature verification against a locally generated RS256 key served via a stubbed JWKS endpoint.
 */
const PROD_ISSUER = 'https://clerk.maelvyn.biz.id'
const PROD_JWKS = `${PROD_ISSUER}/.well-known/jwks.json`
const DEV_ISSUER = 'https://organic-stinkbug-2628.clerk.accounts.dev'
const PROD_ORIGIN = 'https://maelvyn-production.pages.dev'

let privateKey: CryptoKey
let jwk: JWK

const prodEnv = (over: Partial<Env> = {}): Env => ({
  DB: undefined as unknown as Env['DB'],
  APP_ENV: 'production',
  CLERK_ISSUER: PROD_ISSUER,
  CLERK_JWKS_URL: PROD_JWKS,
  CLERK_PUBLISHABLE_KEY: 'pk_live_fixture',
  CLERK_AUTHORIZED_PARTIES: PROD_ORIGIN,
  ...over,
})

async function token(claims: Record<string, unknown> = {}, opts: { issuer?: string; exp?: number | string } = {}) {
  return new SignJWT({ sid: 'sess_fixture', ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setSubject('user_fixture')
    .setIssuer(opts.issuer ?? PROD_ISSUER)
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? '5m')
    .sign(privateKey)
}

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true })
  privateKey = pair.privateKey
  jwk = { ...(await exportJWK(pair.publicKey)), kid: 'test-kid', alg: 'RS256', use: 'sig' }
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url === PROD_JWKS) return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Content-Type': 'application/json' } })
    return new Response('not found', { status: 404 })
  })
})
afterEach(() => vi.clearAllMocks())

describe('production JWT verification (signature, issuer, expiry, azp)', () => {
  it('accepts a correctly signed production token with the exact authorized party', async () => {
    const id = await verifyClerkToken(await token({ azp: PROD_ORIGIN }), prodEnv())
    expect(id).toMatchObject({ provider: 'clerk', subject: 'user_fixture', sessionId: 'sess_fixture' })
  })

  it('rejects a token missing azp in production', async () => {
    await expect(verifyClerkToken(await token(), prodEnv())).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })

  it('rejects an azp mismatch (including root/www domains not in the allowlist)', async () => {
    for (const azp of ['https://maelvyn.biz.id', 'https://www.maelvyn.biz.id', 'https://maelvyn-dev.pages.dev', 'https://evil.example', `${PROD_ORIGIN}/`]) {
      await expect(verifyClerkToken(await token({ azp }), prodEnv())).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    }
  })

  it('rejects every token when the production allowlist is missing or empty', async () => {
    const t = await token({ azp: PROD_ORIGIN })
    await expect(verifyClerkToken(t, prodEnv({ CLERK_AUTHORIZED_PARTIES: undefined }))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    await expect(verifyClerkToken(t, prodEnv({ CLERK_AUTHORIZED_PARTIES: ' , ' }))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })

  it('separates issuers: a Development-issuer token is rejected by Production', async () => {
    await expect(verifyClerkToken(await token({ azp: PROD_ORIGIN }, { issuer: DEV_ISSUER }), prodEnv())).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })

  it('refuses Development (pk_test_) keys in production before any verification', async () => {
    await expect(verifyClerkToken(await token({ azp: PROD_ORIGIN }), prodEnv({ CLERK_PUBLISHABLE_KEY: 'pk_test_x' }))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })

  it('rejects expired and tampered tokens', async () => {
    const expired = await token({ azp: PROD_ORIGIN }, { exp: Math.floor(Date.now() / 1000) - 120 })
    await expect(verifyClerkToken(expired, prodEnv())).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    const good = await token({ azp: PROD_ORIGIN })
    const [h, p, s] = good.split('.')
    const forgedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p!, 'base64url').toString()), sub: 'user_attacker' })).toString('base64url')
    await expect(verifyClerkToken(`${h}.${forgedPayload}.${s}`, prodEnv())).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})

describe('production readiness and secret hygiene', () => {
  const prodVars = { APP_ENV: 'production', CLERK_ISSUER: PROD_ISSUER, CLERK_JWKS_URL: PROD_JWKS, CLERK_PUBLISHABLE_KEY: 'pk_live_fixture', CLERK_AUTHORIZED_PARTIES: PROD_ORIGIN }

  it('is not ready in production when CLERK_SECRET_KEY is missing', async () => {
    const r = await setup({ env: prodVars }).call('GET', '/ready')
    expect(r.status).toBe(503)
    expect(r.body).toMatchObject({ status: 'not_ready', checks: { identity_secret: 'not_configured' } })
  })

  it('never returns the server secret from health, ready or config', async () => {
    const t = setup({ env: { ...prodVars, CLERK_SECRET_KEY: 'sk_live_MUST_NOT_LEAK_123' } })
    for (const path of ['/health', '/ready', '/config']) {
      const r = await t.call('GET', path)
      expect(JSON.stringify(r.body)).not.toContain('sk_live')
      expect(JSON.stringify(r.body)).not.toContain('MUST_NOT_LEAK')
    }
    const cfg = await t.call('GET', '/config')
    expect(cfg.body).toMatchObject({ environment: 'production', identity_instance: 'clerk-production', clerk_publishable_key: 'pk_live_fixture' })
  })

  it('production config exposes no development issuer or test key', async () => {
    const r = await setup({ env: prodVars }).call('GET', '/config')
    expect(JSON.stringify(r.body)).not.toContain('pk_test_')
    expect(JSON.stringify(r.body)).not.toContain('clerk.accounts.dev')
  })

  it('readiness reads the migration ledger regardless of ledger column layout', async () => {
    const t = setup()
    // Re-shape the ledger to the production layout (name PK, no id column) and confirm readiness still tracks it.
    t.db.db.exec(`CREATE TABLE d1_migrations_new (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      INSERT INTO d1_migrations_new (name) SELECT name FROM d1_migrations; DROP TABLE d1_migrations; ALTER TABLE d1_migrations_new RENAME TO d1_migrations;`)
    const r = await t.call('GET', '/ready')
    expect(r.body.checks.migrations).toBe('ok')
  })

  it('an unverified identity in production gets no owner role, membership or workspace', async () => {
    const t = setup({ env: { ...prodVars, CLERK_SECRET_KEY: 'sk_live_fixture' } })
    expect((await t.call('POST', '/platform/owner/claim', 'unverified-owner')).status).toBe(403)
    const s = await t.call('GET', '/session', 'unverified-owner')
    expect(s.body).toMatchObject({ platform_role: null, memberships: [] })
    const n = await t.db.prepare(`SELECT (SELECT COUNT(*) FROM platform_roles) + (SELECT COUNT(*) FROM workspace_members) + (SELECT COUNT(*) FROM venture_members) + (SELECT COUNT(*) FROM workspaces) AS n`).first<{ n: number }>()
    expect(n!.n).toBe(0)
  })
})
