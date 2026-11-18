import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, withSecurityHeaders } from '../server/worker'
import type { Env } from '../server/env'
import { bootstrap, setup } from './helpers'

/**
 * Production hardening gates: per-environment CSP, real-evidence default, and fail-closed identity.
 */
const PROD = 'https://clerk.maelvyn.biz.id'
const DEV = 'https://organic-stinkbug-2628.clerk.accounts.dev'

const envWith = (over: Partial<Env>): Env => ({
  DB: undefined as unknown as Env['DB'],
  APP_ENV: 'production',
  CLERK_ISSUER: PROD,
  ...over,
})

describe('Content-Security-Policy is derived from the deployment environment', () => {
  it('Production authorizes only the Production Clerk origin', () => {
    const csp = contentSecurityPolicy(envWith({ CLERK_ISSUER: PROD }))
    expect(csp).toContain(PROD)
    expect(csp).not.toContain('accounts.dev')
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
  })

  it('Development authorizes only the Development Clerk origin (no Production domain)', () => {
    const csp = contentSecurityPolicy(envWith({ APP_ENV: 'development', CLERK_ISSUER: DEV }))
    expect(csp).toContain(DEV)
    expect(csp).not.toContain('clerk.maelvyn.biz.id')
  })

  it('never hardcodes an environment domain when the issuer is absent', () => {
    const csp = contentSecurityPolicy(envWith({ CLERK_ISSUER: undefined }))
    expect(csp).not.toContain('accounts.dev')
    expect(csp).not.toContain('clerk.maelvyn.biz.id')
    expect(csp).toContain("default-src 'self'")
  })

  it('applies the security headers to whatever response the Worker returns', () => {
    const res = withSecurityHeaders(new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }), envWith({ CLERK_ISSUER: PROD }))
    expect(res.headers.get('Content-Security-Policy')).toContain(PROD)
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})

describe('research evidence mode cannot silently be synthetic in Production', () => {
  const prodVars = {
    APP_ENV: 'production',
    CLERK_ISSUER: PROD,
    CLERK_JWKS_URL: `${PROD}/.well-known/jwks.json`,
    CLERK_PUBLISHABLE_KEY: 'pk_live_fixture',
    CLERK_AUTHORIZED_PARTIES: 'https://maelvyn-production.pages.dev',
    CLERK_SECRET_KEY: 'sk_live_fixture',
    ARTIFACTS: {} as never,
  }

  it('Production defaults an unspecified mode to live (real evidence), then blocks with no provider', async () => {
    const t = setup({ env: prodVars })
    const { vid } = await bootstrap(t)
    const r = await t.call('POST', `/ventures/${vid}/research`, 'owner', { objective: 'Synthetic demand probe for production default mode' }, { 'Idempotency-Key': 'idem-prod-mode-01' })
    expect(r.status).toBe(201)
    const task = await t.call('GET', `/research/${r.body.task_id}`, 'owner')
    expect(task.body.task.execution_mode).toBe('live')
    // The live route is not enabled for this workspace, so the task stops. It must NOT fall back
    // to synthetic evidence, and no synthetic source may have been recorded.
    expect(task.body.task.status).toBe('blocked')
    expect(task.body.task.status_reason).toMatch(/PROVIDER_(DISABLED|NOT_CONFIGURED)/)
    expect(task.body.evidence).toEqual([])
    expect(task.body.artifact).toBeNull()
  })

  it('non-production still defaults to synthetic so no paid provider is called', async () => {
    const t = setup()
    const { vid } = await bootstrap(t)
    const r = await t.call('POST', `/ventures/${vid}/research`, 'owner', { objective: 'Synthetic demand probe for development default mode' }, { 'Idempotency-Key': 'idem-dev-mode-001' })
    expect(r.status).toBe(201)
    const task = await t.call('GET', `/research/${r.body.task_id}`, 'owner')
    expect(task.body.task.execution_mode).toBe('synthetic')
    expect(task.body.task.status).toBe('awaiting_review')
  })

  it('Production fails closed when the Clerk server secret is absent', async () => {
    const t = setup({ env: { ...prodVars, CLERK_SECRET_KEY: undefined } })
    const r = await t.call('GET', '/session', 'owner')
    expect(r.status).toBe(503)
    expect(r.body.error.code).toBe('SERVICE_UNAVAILABLE')
    // public surfaces keep working so health/readiness can be observed
    expect((await t.call('GET', '/health')).status).toBe(200)
  })
})
