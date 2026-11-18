import { createApp } from '../server/app'
import type { Env } from '../server/env'
import { AppError } from '../server/lib/http'
import { migratedDb, type D1Shim } from './d1shim'

export type FetchMock = (url: string, init?: RequestInit) => Promise<Response>

export function setup(opts: { fetchImpl?: FetchMock; env?: Partial<Env> } = {}) {
  const db = migratedDb()
  const env: Env = {
    DB: db as unknown as Env['DB'], APP_ENV: 'test',
    CLERK_ISSUER: 'https://example.clerk.accounts.dev', CLERK_JWKS_URL: 'https://example.clerk.accounts.dev/.well-known/jwks.json',
    CLERK_PUBLISHABLE_KEY: 'pk_test_x', TAVILY_API_KEY: 'tvly-TESTSECRET123', FIRECRAWL_API_KEY: 'fc-0123456789abcdef',
    ...opts.env,
  }
  // Test verifier: token "tok:<subject>" → identity. Anything else is rejected (simulates bad signature).
  const app = createApp({
    verifier: async (token) => {
      if (!token.startsWith('tok:')) throw new AppError('UNAUTHENTICATED', 'Session token is invalid or expired.')
      return { provider: 'clerk', subject: token.slice(4) }
    },
    // Test profile: subject 'owner' has the verified owner email; '<name>' → '<name>@example.test' verified; 'unverified-*' unverified.
    lookupProfile: async (s: string) => ({ displayName: `Synthetic ${s}`, primaryEmail: s === 'owner' ? 'sparkmind.support@gmail.com' : s.startsWith('acct:') ? s.slice(5) : `${s}@example.test`, emailVerified: !s.startsWith('unverified') }),
    run: { fetchImpl: opts.fetchImpl as typeof fetch | undefined, timeoutMs: 2000 },
  })
  async function call(method: string, path: string, user?: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await app.request(`/api/v1${path}`, {
      method,
      headers: { ...(user ? { Authorization: `Bearer tok:${user}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }, env)
    return { status: res.status, body: (await res.json()) as Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  return { app, env, db: db as D1Shim, call }
}

/** Binds the Platform Owner (subject 'owner', verified owner email) and creates a synthetic workspace + venture. */
export async function claimOwner(t: ReturnType<typeof setup>) {
  return t.call('POST', '/platform/owner/claim', 'owner')
}

export async function bootstrap(t: ReturnType<typeof setup>, user = 'owner') {
  if (user === 'owner') await claimOwner(t)
  const ws = await t.call('POST', '/workspaces', user, { name: 'Synthetic Studio' })
  const wid = ws.body.workspace.id as string
  const v = await t.call('POST', `/workspaces/${wid}/ventures`, user, { name: 'Synthetic Venture', code: 'SYN-01', category: 'digital' })
  return { wid, vid: v.body.venture.id as string }
}

/** Adds an existing (signed-in) user to a workspace with a role, optionally to a venture. */
export async function grant(t: ReturnType<typeof setup>, user: string, wid: string, role: string, vid?: string) {
  await t.call('GET', '/session', user) // provisions person
  const p = await t.db.prepare(`SELECT person_id FROM identity_links WHERE provider_subject = ?`).bind(user).first<{ person_id: string }>()
  const ts = new Date().toISOString()
  await t.db.prepare(`INSERT INTO workspace_members (id, workspace_id, person_id, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)`).bind(`wsm_${user}_${wid}`, wid, p!.person_id, role, ts, ts).run()
  if (vid) await t.db.prepare(`INSERT INTO venture_members (id, venture_id, person_id, role_label, status, created_at, updated_at) VALUES (?, ?, ?, 'contributor', 'active', ?, ?)`).bind(`vnm_${user}_${vid}`, vid, p!.person_id, ts, ts).run()
  return p!.person_id
}

export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
