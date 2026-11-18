import { Hono, type Context } from 'hono'
import { z } from 'zod'
import { audit, auditStatement } from './audit/audit'
import { authorizeVenture, authorizeWorkspace, listVisibleVentures } from './authorization/policy'
import type { AppEnv } from './env'
import { fetchClerkProfile, verifyClerkToken, type ProfileLookup, type TokenVerifier } from './identity/clerk'
import { applyProfile, resolvePrincipal } from './identity/principal'
import { registerPlatformRoutes } from './platform/routes'
import { isPlatformOwner, platformAudit } from './platform/owner'
import { registerGovernanceRoutes } from './governance/routes'
import { registerFinanceRoutes } from './finance/routes'
import { registerRightsRoutes } from './rights/routes'
import { registerOperationsRoutes } from './operations/routes'
import { registerMemoryRoutes } from './memory/routes'
import { registerPortfolioRoutes } from './portfolio/routes'
import { registerMeRoutes } from './me/routes'
import { AppError, errorBody, newId, nowIso, ok, redact, todayUtc } from './lib/http'
import { rateLimit } from './lib/ratelimit'
import { parseJson, principalOf } from './lib/request'
import { registerMemberRoutes } from './members/routes'
import { getAdapter } from './providers/registry'
import { CreateResearchInput, createAndRunResearch, reviewResearch, ReviewInput, type RunDeps } from './research/agent'

export type AppDeps = { verifier?: TokenVerifier; lookupProfile?: ProfileLookup; run?: RunDeps }

const EXPECTED_MIGRATIONS = ['0001_initial.sql', '0002_agentic_foundation.sql', '0003_workspace_invitations.sql', '0004_platform_identity_boundaries.sql', '0005_governance.sql', '0006_finance_rights.sql', '0007_operations.sql', '0008_runtime_platform.sql']

export function createApp(deps: AppDeps = {}) {
  const verifier = deps.verifier ?? verifyClerkToken
  const app = new Hono<AppEnv>().basePath('/api/v1')

  // ---- Request id + security headers ---------------------------------------
  app.use('*', async (c, next) => {
    c.set('requestId', c.req.header('cf-ray') ? `${c.req.header('cf-ray')}-${newId('req').slice(4, 12)}` : newId('req'))
    await next()
    c.header('X-Request-Id', c.get('requestId'))
    c.header('Cache-Control', 'no-store')
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('X-Frame-Options', 'DENY')
  })

  app.onError((err, c) => {
    const rid = c.get('requestId') ?? newId('req')
    if (err instanceof AppError) return c.json(errorBody(err.code, err.message, rid, err.details), err.status)
    console.error(JSON.stringify({ level: 'error', request_id: rid, message: redact(String(err?.message ?? err)) }))
    return c.json(errorBody('INTERNAL_ERROR', 'An unexpected error occurred.', rid), 500)
  })
  app.notFound((c) => c.json(errorBody('NOT_FOUND', 'Route not found.', c.get('requestId')), 404))

  // ---- Public endpoints ------------------------------------------------------
  app.get('/health', (c) => ok(c, { status: 'ok', service: 'maelvyn-api', environment: c.env.APP_ENV, time: nowIso() }))

  app.get('/ready', async (c) => {
    const checks: Record<string, string> = {}
    try {
      await c.env.DB.prepare('SELECT 1').first()
      checks.database = 'ok'
      const applied = await c.env.DB.prepare(`SELECT name FROM d1_migrations ORDER BY name`).all<{ name: string }>().then((r) => r.results.map((x) => x.name)).catch(() => null)
      const tables = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('workspaces','tasks','provider_registry')`).first<{ n: number }>()
      checks.schema = tables?.n === 3 ? 'ok' : 'missing_tables'
      checks.migrations = applied === null ? 'untracked' : EXPECTED_MIGRATIONS.every((m) => applied.includes(m)) ? 'ok' : `pending (${applied.length}/${EXPECTED_MIGRATIONS.length})`
    } catch { checks.database = 'error' }
    checks.identity = c.env.CLERK_ISSUER && c.env.CLERK_JWKS_URL ? 'configured' : 'not_configured'
    const production = c.env.APP_ENV === 'production'
    const authorizedParties = (c.env.CLERK_AUTHORIZED_PARTIES ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    checks.identity_secret = c.env.CLERK_SECRET_KEY ? 'configured' : 'not_configured'
    checks.authorized_parties = authorizedParties.length > 0 ? 'configured' : 'not_configured'
    checks.publishable_key = !c.env.CLERK_PUBLISHABLE_KEY ? 'not_configured'
      : production && !c.env.CLERK_PUBLISHABLE_KEY.startsWith('pk_live_') ? 'invalid_for_production'
      : !production && c.env.CLERK_PUBLISHABLE_KEY.startsWith('pk_live_') ? 'invalid_for_development'
      : 'configured'
    const productionIdentityReady = !production || (
      checks.identity_secret === 'configured' &&
      checks.authorized_parties === 'configured' &&
      checks.publishable_key === 'configured'
    )
    // Production additionally requires a complete, tracked migration ledger.
    const migrationsReady = !production || checks.migrations === 'ok'
    const ready = checks.database === 'ok' && checks.schema === 'ok' && checks.identity === 'configured' && productionIdentityReady && migrationsReady
    return ok(c, { status: ready ? 'ready' : 'not_ready', checks }, ready ? 200 : 503)
  })

  app.get('/config', (c) => ok(c, {
    environment: c.env.APP_ENV,
    clerk_publishable_key: c.env.CLERK_PUBLISHABLE_KEY ?? null,
    identity_instance: c.env.CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_') ? 'clerk-development' : c.env.CLERK_PUBLISHABLE_KEY ? 'clerk-production' : 'none',
    data_policy: c.env.APP_ENV === 'production' ? 'production' : 'synthetic-only',
  }))

  // ---- Authentication (everything below) ------------------------------------
  app.use('*', async (c, next) => {
    const h = c.req.header('Authorization') ?? ''
    const m = /^Bearer\s+(.+)$/i.exec(h)
    if (!m) throw new AppError('UNAUTHENTICATED', 'Authentication required.')
    const identity = await verifier(m[1]!.trim(), c.env)
    const lookup: ProfileLookup = deps.lookupProfile ?? ((s) => fetchClerkProfile(c.env, s))
    const principal = await resolvePrincipal(c.env, identity, lookup)
    c.set('principal', principal)
    // Sensitive actions (owner claim, invitation acceptance) re-read the verified email from the identity provider.
    c.set('refreshProfile', async () => {
      const prof = await lookup(identity.subject)
      if (!prof) throw new AppError('UNAUTHENTICATED', 'Could not verify your identity profile. Please retry.')
      const row = await applyProfile(c.env, principal.personId, prof)
      const fresh = { ...principal, displayName: row?.display_name ?? principal.displayName, email: prof.primaryEmail, emailVerified: prof.emailVerified }
      c.set('principal', fresh)
      return fresh
    })
    await next()
  })

  registerPlatformRoutes(app)
  registerMemberRoutes(app)
  registerGovernanceRoutes(app)
  registerFinanceRoutes(app)
  registerRightsRoutes(app)
  registerOperationsRoutes(app)
  registerMemoryRoutes(app)
  registerPortfolioRoutes(app)
  registerMeRoutes(app)

  // ---- Workspaces ------------------------------------------------------------
  app.get('/workspaces', async (c) => {
    const p = principalOf(c)
    const rows = (await c.env.DB.prepare(
      `SELECT w.id, w.name, w.slug, w.status, w.is_synthetic, w.default_currency, wm.role, w.created_at FROM workspace_members wm JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.person_id = ? AND wm.status = 'active' ORDER BY w.created_at`,
    ).bind(p.personId).all()).results
    return ok(c, { workspaces: rows })
  })

  /** Only the Platform Owner creates workspaces (no self-service; no auto-membership for anyone else). */
  app.post('/workspaces', async (c) => {
    const p = principalOf(c)
    if (!(await isPlatformOwner(c.env, p.personId))) throw new AppError('FORBIDDEN', 'Only the Platform Owner can create workspaces.')
    await rateLimit(c.env, `ws-create:${p.personId}`, 10)
    const body = await parseJson(c, z.object({ name: z.string().trim().min(3).max(80), synthetic: z.boolean().default(true) }))
    if (c.env.APP_ENV !== 'production' && !body.synthetic) throw new AppError('VALIDATION_ERROR', 'Non-production environments may only hold synthetic workspaces.')
    const id = newId('wsp')
    const slug = `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'workspace'}-${id.slice(-6)}`
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO workspaces (id, name, slug, status, default_currency, is_synthetic, created_at, updated_at) VALUES (?, ?, ?, 'active', 'IDR', ?, ?, ?)`).bind(id, body.name, slug, body.synthetic ? 1 : 0, ts, ts),
      c.env.DB.prepare(`INSERT INTO workspace_members (id, workspace_id, person_id, role, status, granted_by_person_id, created_at, updated_at) VALUES (?, ?, ?, 'workspace_admin', 'active', ?, ?, ?)`).bind(newId('wsm'), id, p.personId, p.personId, ts, ts),
      ...['mock-search', 'tavily', 'firecrawl', 'apify', 'scrapely', 'workers-ai'].map((pid) =>
        c.env.DB.prepare(`INSERT INTO workspace_provider_settings (workspace_id, provider_id, live_enabled, paid_execution_allowed, daily_credit_cap, per_task_credit_cap, actor_allowlist_json, updated_at) VALUES (?, ?, 0, 0, 0, 0, '[]', ?)`).bind(id, pid, ts)),
      auditStatement(c.env, { workspaceId: id, actorPersonId: p.personId, action: 'workspace.created', targetType: 'workspace', targetId: id, requestId: c.get('requestId'), metadata: { synthetic: body.synthetic } }),
      platformAudit(c.env, { actorPersonId: p.personId, action: 'workspace.created', targetType: 'workspace', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { workspace: { id, name: body.name, slug, role: 'workspace_admin', is_synthetic: body.synthetic ? 1 : 0 } }, 201)
  })

  app.get('/workspaces/:wid', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.read', c.get('requestId'))
    const ws = await c.env.DB.prepare(`SELECT id, name, slug, status, is_synthetic, default_currency, created_at FROM workspaces WHERE id = ?`).bind(access.workspaceId).first()
    const ventures = await listVisibleVentures(c.env, p, access)
    const ids = ventures.map((v) => (v as { id: string }).id)
    let tasks: Record<string, number> = {}
    if (ids.length) {
      const rows = (await c.env.DB.prepare(`SELECT status, COUNT(*) AS n FROM tasks WHERE venture_id IN (${ids.map(() => '?').join(',')}) GROUP BY status`).bind(...ids).all<{ status: string; n: number }>()).results
      tasks = Object.fromEntries(rows.map((r) => [r.status, r.n]))
    }
    return ok(c, { workspace: ws, role: access.role, stats: { ventures: ventures.length, tasks } })
  })

  // ---- Ventures --------------------------------------------------------------
  app.get('/workspaces/:wid/ventures', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'venture.read', c.get('requestId'))
    return ok(c, { ventures: await listVisibleVentures(c.env, p, access) })
  })

  app.post('/workspaces/:wid/ventures', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'venture.create', c.get('requestId'))
    const body = await parseJson(c, z.object({
      name: z.string().trim().min(3).max(100),
      code: z.string().trim().regex(/^[A-Z0-9-]{2,16}$/, 'Use 2–16 uppercase letters, digits or dashes'),
      description: z.string().trim().max(1000).optional(),
      category: z.enum(['digital', 'commerce', 'productive_asset', 'investment_capital', 'other']),
    }))
    const id = newId('ven')
    const ts = nowIso()
    try {
      await c.env.DB.batch([
        c.env.DB.prepare(`INSERT INTO ventures (id, workspace_id, code, name, description, category, stage, status, accountable_person_id, created_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'discover', 'draft', ?, ?, ?, ?)`)
          .bind(id, access.workspaceId, body.code, body.name, body.description ?? null, body.category, p.personId, p.personId, ts, ts),
        c.env.DB.prepare(`INSERT INTO venture_members (id, venture_id, person_id, role_label, scope_description, status, created_at, updated_at) VALUES (?, ?, ?, 'operator', 'Creator of draft venture (development)', 'active', ?, ?)`)
          .bind(newId('vnm'), id, p.personId, ts, ts),
        auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: id, actorPersonId: p.personId, action: 'venture.created', targetType: 'venture', targetId: id, requestId: c.get('requestId'), metadata: { status: 'draft', category: body.category } }),
      ])
    } catch (e) {
      if (String(e).includes('UNIQUE')) throw new AppError('CONFLICT', 'A venture with this code already exists in the workspace.')
      throw e
    }
    return ok(c, { venture: { id, ...body, stage: 'discover', status: 'draft' } }, 201)
  })

  app.get('/ventures/:vid', async (c) => {
    const p = principalOf(c)
    const access = await authorizeVenture(c.env, p, c.req.param('vid'), 'venture.read', c.get('requestId'))
    const venture = await c.env.DB.prepare(`SELECT id, workspace_id, code, name, description, category, stage, status, created_at FROM ventures WHERE id = ?`).bind(access.ventureId).first()
    const tasks = (await c.env.DB.prepare(
      `SELECT id, objective, execution_mode, status, status_reason, budget_credits, credits_used, created_at FROM tasks WHERE venture_id = ? ORDER BY created_at DESC LIMIT 50`,
    ).bind(access.ventureId).all()).results
    return ok(c, { venture, role: access.role, tasks })
  })

  // ---- Research Brief Agent --------------------------------------------------
  app.post('/ventures/:vid/research', async (c) => {
    const p = principalOf(c)
    const access = await authorizeVenture(c.env, p, c.req.param('vid'), 'research.create', c.get('requestId'))
    const idem = c.req.header('Idempotency-Key')
    if (!idem || !/^[A-Za-z0-9_-]{8,100}$/.test(idem)) throw new AppError('VALIDATION_ERROR', 'A valid Idempotency-Key header (8–100 chars) is required.')
    await rateLimit(c.env, `research:${p.personId}`, 10)
    const body = await parseJson(c, CreateResearchInput)
    const r = await createAndRunResearch(c.env, p, access, body, idem, c.get('requestId'), deps.run)
    return ok(c, { task_id: r.taskId, replayed: r.replayed }, r.replayed ? 200 : 201)
  })

  const loadTaskAccess = async (c: Context<AppEnv>, action: 'venture.read' | 'research.review') => {
    const p = principalOf(c)
    const t = await c.env.DB.prepare(`SELECT venture_id FROM tasks WHERE id = ?`).bind(c.req.param('tid')).first<{ venture_id: string }>()
    if (!t) throw new AppError('NOT_FOUND', 'Task not found.')
    try {
      return { p, access: await authorizeVenture(c.env, p, t.venture_id, action, c.get('requestId')) }
    } catch (e) {
      if (e instanceof AppError && e.code === 'NOT_FOUND') throw new AppError('NOT_FOUND', 'Task not found.')
      throw e
    }
  }

  app.get('/research/:tid', async (c) => {
    const { access } = await loadTaskAccess(c, 'venture.read')
    const tid = c.req.param('tid')
    const task = await c.env.DB.prepare(`SELECT id, venture_id, workspace_id, objective, execution_mode, data_class, autonomy_level, status, status_reason, budget_credits, credits_used, contract_json, created_at, updated_at FROM tasks WHERE id = ? AND venture_id = ?`).bind(tid, access.ventureId).first<Record<string, unknown>>()
    const executions = (await c.env.DB.prepare(`SELECT step, provider_id, status, detail_json, started_at, finished_at FROM task_executions WHERE task_id = ? ORDER BY started_at, rowid`).bind(tid).all()).results
    const evidence = (await c.env.DB.prepare(`SELECT id, provider_id, url, title, snippet, extracted_excerpt, relevance_score, evidence_class, trust, retrieved_at FROM evidence_sources WHERE task_id = ? ORDER BY rowid`).bind(tid).all()).results
    const artifact = await c.env.DB.prepare(`SELECT id, title, brief_json, generator, status, reviewed_by_person_id, review_note, reviewed_at, created_at FROM research_artifacts WHERE task_id = ?`).bind(tid).first<Record<string, unknown>>()
    return ok(c, {
      task: task ? { ...task, contract: JSON.parse(String(task.contract_json)), contract_json: undefined } : null,
      executions: executions.map((e) => ({ ...e, detail: JSON.parse(String((e as { detail_json: string }).detail_json ?? 'null')), detail_json: undefined })),
      evidence,
      artifact: artifact ? { ...artifact, brief: JSON.parse(String(artifact.brief_json)), brief_json: undefined } : null,
    })
  })

  app.post('/research/:tid/review', async (c) => {
    const { p, access } = await loadTaskAccess(c, 'research.review')
    const body = await parseJson(c, ReviewInput)
    const status = await reviewResearch(c.env, p, access, c.req.param('tid'), body, c.get('requestId'))
    return ok(c, { status })
  })

  // ---- Providers -------------------------------------------------------------
  app.get('/workspaces/:wid/providers', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.read', c.get('requestId'))
    const rows = (await c.env.DB.prepare(
      `SELECT r.id, r.display_name, r.kind, r.capabilities_json, r.secret_ref, r.docs_url, r.pricing_note, r.is_external,
              s.live_enabled, s.paid_execution_allowed, s.daily_credit_cap, s.per_task_credit_cap, s.last_health_status, s.last_health_at
       FROM provider_registry r LEFT JOIN workspace_provider_settings s ON s.provider_id = r.id AND s.workspace_id = ? ORDER BY r.is_external, r.id`,
    ).bind(access.workspaceId).all<Record<string, unknown>>()).results
    const today = (await c.env.DB.prepare(`SELECT provider_id, COALESCE(SUM(COALESCE(actual_credits, estimated_credits)),0) AS used FROM provider_usage WHERE workspace_id = ? AND usage_date = ? AND outcome <> 'denied' GROUP BY provider_id`).bind(access.workspaceId, todayUtc()).all<{ provider_id: string; used: number }>()).results
    const used = new Map(today.map((t) => [t.provider_id, t.used]))
    return ok(c, {
      role: access.role,
      providers: rows.map((r) => {
        const adapter = getAdapter(String(r.id))
        return {
          ...r, capabilities: JSON.parse(String(r.capabilities_json)), capabilities_json: undefined,
          credential_configured: adapter ? adapter.isConfigured(c.env) : false, // boolean only; secret never leaves the server
          credits_used_today: used.get(String(r.id)) ?? 0,
        }
      }),
    })
  })

  app.post('/workspaces/:wid/providers/:pid/health', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.providers.manage', c.get('requestId'))
    await rateLimit(c.env, `health:${access.workspaceId}`, 20)
    const adapter = getAdapter(c.req.param('pid'))
    if (!adapter) throw new AppError('NOT_FOUND', 'Provider not found.')
    let result
    try {
      result = await adapter.healthCheck(c.env, { idempotencyKey: newId('hc'), timeoutMs: 10000, fetchImpl: deps.run?.fetchImpl })
    } catch {
      result = { state: 'ERROR' as const, detail: 'Health check failed (network/timeout).' }
    }
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_provider_settings SET last_health_status = ?, last_health_at = ? WHERE workspace_id = ? AND provider_id = ?`).bind(result.state, nowIso(), access.workspaceId, adapter.id),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'provider.health_checked', targetType: 'provider', targetId: adapter.id, requestId: c.get('requestId'), metadata: { state: result.state } }),
    ])
    return ok(c, { provider: adapter.id, health: result })
  })

  app.put('/workspaces/:wid/providers/:pid', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.providers.manage', c.get('requestId'))
    const adapter = getAdapter(c.req.param('pid'))
    if (!adapter) throw new AppError('NOT_FOUND', 'Provider not found.')
    const body = await parseJson(c, z.object({
      live_enabled: z.boolean(),
      daily_credit_cap: z.number().int().min(0).max(100),
      per_task_credit_cap: z.number().int().min(0).max(10),
      paid_execution_allowed: z.boolean().optional(),
    }))
    if (body.paid_execution_allowed) {
      // Paid execution / billing activation is a reserved human decision requiring a formal approval workflow (not yet implemented).
      throw new AppError('APPROVAL_REQUIRED', 'Paid execution requires an approved budget through the governance approval workflow. It cannot be enabled from settings.')
    }
    if (body.live_enabled && (adapter.capabilities.includes('actor.run') || adapter.capabilities.includes('inference.text'))) {
      throw new AppError('APPROVAL_REQUIRED', `${adapter.id} cannot be enabled until an Actor/model allowlist and budget are approved.`)
    }
    if (body.live_enabled && body.daily_credit_cap === 0) throw new AppError('VALIDATION_ERROR', 'Set a daily credit cap greater than 0 to enable live execution.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE workspace_provider_settings SET live_enabled = ?, daily_credit_cap = ?, per_task_credit_cap = ?, updated_by_person_id = ?, updated_at = ? WHERE workspace_id = ? AND provider_id = ?`)
        .bind(body.live_enabled ? 1 : 0, body.daily_credit_cap, body.per_task_credit_cap, p.personId, nowIso(), access.workspaceId, adapter.id),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'provider.settings_changed', targetType: 'provider', targetId: adapter.id, requestId: c.get('requestId'), metadata: body }),
    ])
    return ok(c, { provider: adapter.id, settings: body })
  })

  // ---- Agents, kill switches, audit, usage -----------------------------------
  app.get('/agents', async (c) => {
    principalOf(c)
    const rows = (await c.env.DB.prepare(
      `SELECT r.id, r.display_name, r.purpose, r.specialist_role, r.status, v.version, v.autonomy_level, v.tool_allowlist_json, v.data_classes_json, v.max_task_credits
       FROM agent_registry r LEFT JOIN agent_versions v ON v.agent_id = r.id AND v.is_current = 1 ORDER BY r.id`,
    ).all<Record<string, unknown>>()).results
    return ok(c, { agents: rows.map((r) => ({ ...r, tool_allowlist: JSON.parse(String(r.tool_allowlist_json ?? '[]')), data_classes: JSON.parse(String(r.data_classes_json ?? '[]')), tool_allowlist_json: undefined, data_classes_json: undefined })) })
  })

  app.get('/workspaces/:wid/kill-switches', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.read', c.get('requestId'))
    const rows = (await c.env.DB.prepare(`SELECT switch_key, engaged, reason, updated_at FROM kill_switches WHERE workspace_id = ? ORDER BY switch_key`).bind(access.workspaceId).all()).results
    return ok(c, { system_kill_switch: c.env.SYSTEM_KILL_SWITCH === 'true', switches: rows })
  })

  app.put('/workspaces/:wid/kill-switches', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.killswitch.manage', c.get('requestId'))
    const body = await parseJson(c, z.object({
      switch_key: z.string().regex(/^(all|agent:[a-z0-9-]+|provider:[a-z0-9-]+)$/),
      engaged: z.boolean(),
      reason: z.string().trim().min(3).max(300),
    }))
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO kill_switches (workspace_id, switch_key, engaged, reason, updated_by_person_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(workspace_id, switch_key) DO UPDATE SET engaged = excluded.engaged, reason = excluded.reason, updated_by_person_id = excluded.updated_by_person_id, updated_at = excluded.updated_at`)
        .bind(access.workspaceId, body.switch_key, body.engaged ? 1 : 0, body.reason, p.personId, nowIso()),
      auditStatement(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: body.engaged ? 'killswitch.engaged' : 'killswitch.released', targetType: 'kill_switch', targetId: body.switch_key, requestId: c.get('requestId'), reason: body.reason }),
    ])
    return ok(c, { switch_key: body.switch_key, engaged: body.engaged })
  })

  app.get('/workspaces/:wid/audit', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.audit.read', c.get('requestId'))
    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 100) || 100, 1), 200)
    const rows = (await c.env.DB.prepare(
      `SELECT a.id, a.venture_id, a.actor_person_id, p.display_name AS actor_name, a.action, a.target_type, a.target_id, a.request_id, a.reason, a.metadata_json, a.created_at
       FROM audit_events a LEFT JOIN people p ON p.id = a.actor_person_id WHERE a.workspace_id = ? ORDER BY a.created_at DESC, a.rowid DESC LIMIT ?`,
    ).bind(access.workspaceId, limit).all()).results
    const decisions = (await c.env.DB.prepare(`SELECT action, decision, reason, venture_id, created_at FROM permission_decisions WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 50`).bind(access.workspaceId).all()).results
    await audit(c.env, { workspaceId: access.workspaceId, actorPersonId: p.personId, action: 'audit.viewed', targetType: 'workspace', targetId: access.workspaceId, requestId: c.get('requestId') })
    return ok(c, { events: rows, permission_decisions: decisions })
  })

  app.get('/workspaces/:wid/usage', async (c) => {
    const p = principalOf(c)
    const access = await authorizeWorkspace(c.env, p, c.req.param('wid'), 'workspace.read', c.get('requestId'))
    const rows = (await c.env.DB.prepare(
      `SELECT usage_date, provider_id, capability, outcome, COUNT(*) AS calls, COALESCE(SUM(COALESCE(actual_credits, estimated_credits)),0) AS credits
       FROM provider_usage WHERE workspace_id = ? GROUP BY usage_date, provider_id, capability, outcome ORDER BY usage_date DESC LIMIT 100`,
    ).bind(access.workspaceId).all()).results
    return ok(c, { usage: rows })
  })

  return app
}
