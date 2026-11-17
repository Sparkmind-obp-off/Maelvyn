// Browser E2E for Clerk Development sign-in against a deployed DEV environment.
// Usage: BASE=https://maelvyn-dev.pages.dev SK=sk_test_... CLERK_TEST_USER_ID=user_... npm run test:e2e
// Uses a Clerk sign-in ticket for a SYNTHETIC test user. Never run with production keys.
import { chromium } from 'playwright'
const BASE = process.env.BASE
const SK = process.env.SK
const USER = process.env.CLERK_TEST_USER_ID
if (!BASE || !SK || !USER) { console.error('Set BASE, SK (Clerk DEV secret) and CLERK_TEST_USER_ID'); process.exit(2) }
if (!SK.startsWith('sk_test_')) { console.error('Refusing to run with a non-development Clerk key'); process.exit(2) }
const out = (k, v) => console.log(k.padEnd(28), typeof v === 'string' ? v : JSON.stringify(v))

const tok = await (await fetch('https://api.clerk.com/v1/sign_in_tokens', {
  method: 'POST', headers: { Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: USER, expires_in_seconds: 300 }),
})).json()
if (!tok.token) { console.log('sign-in token error', JSON.stringify(tok)); process.exit(1) }

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, null, { timeout: 30000 })
out('ClerkJS runtime version', await page.evaluate(() => window.Clerk.version))
out('signed out initially', await page.evaluate(() => !window.Clerk.user))
out('sign-in button visible', await page.getByRole('button', { name: 'Masuk' }).first().isVisible())

const res = await page.evaluate(async (ticket) => {
  try {
    const si = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket })
    const sid = si.createdSessionId || si.created_session_id
    await window.Clerk.setActive({ session: sid })
    return { status: si.status, ok: true }
  } catch (e) { return { ok: false, err: String(e?.errors?.[0]?.longMessage || e?.message || e) } }
}, tok.token)
out('ticket sign-in', res)
await page.waitForTimeout(1500)
out('signed in user', await page.evaluate(() => window.Clerk.user?.id))
out('UserButton rendered', await page.locator('.cl-userButtonTrigger, .cl-userButton-root').first().isVisible().catch(() => false))

const api = await page.evaluate(async () => {
  const t = await window.Clerk.session.getToken()
  const s = await fetch('/api/v1/session', { headers: { Authorization: `Bearer ${t}` } })
  const tampered = await fetch('/api/v1/session', { headers: { Authorization: `Bearer ${t.slice(0, -2)}xx` } })
  const none = await fetch('/api/v1/session')
  return { session: s.status, body: (await s.json()).principal, tampered: tampered.status, unauth: none.status }
})
out('API /session (browser JWT)', api)

await page.goto(`${BASE}/workspaces`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
out('/workspaces heading', await page.getByRole('heading', { name: 'Workspace', exact: true }).isVisible())

await page.evaluate(() => window.Clerk.signOut())
await page.waitForTimeout(1500)
out('signed out after signOut', await page.evaluate(() => !window.Clerk.user))
out('console errors', errors.filter((e) => !e.includes('WebGL')))
await browser.close()
