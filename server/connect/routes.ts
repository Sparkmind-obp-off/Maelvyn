import { Hono } from 'hono'
import { z } from 'zod'
import { authorizeVenture, authorizeWorkspace, isWorkspaceWide, listVisibleVentures } from '../authorization/policy'
import { auditStatement } from '../audit/audit'
import type { AppEnv } from '../env'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { principalOf, parseJson } from '../lib/request'
import { rateLimit } from '../lib/ratelimit'

const CONNECT_STATUS = z.enum(['proposed', 'in_progress', 'blocked', 'done', 'needs_review'])
const DOCS = [
  { id: 'readme', title: 'Repository overview', path: 'README.md', access: 'public' },
  { id: 'api-contract', title: 'API contract', path: 'docs/API-CONTRACT.md', access: 'internal' },
  { id: 'architecture', title: 'System architecture', path: 'docs/SYSTEM-ARCHITECTURE.md', access: 'internal' },
  { id: 'security', title: 'Security, privacy & operations', path: 'docs/SECURITY-PRIVACY-OPERATIONS.md', access: 'internal' },
  { id: 'connect', title: 'MAELVYN Connect', path: 'docs/MAELVYN-CONNECT.md', access: 'internal' },
]
const TOOL_CATALOG = [
  { name: 'maelvyn_get_connect_manifest', access: 'read', description: 'Read the Connect capability and security contract.' },
  { name: 'maelvyn_list_registry', access: 'read', description: 'Read scoped projects, providers, tasks, and documentation records.' },
  { name: 'maelvyn_list_status_proposals', access: 'read', description: 'Read auditable status proposals within an authorized workspace.' },
  { name: 'maelvyn_propose_task_status', access: 'write', description: 'Record a scoped, human-reviewable task status proposal; never mutates a task directly.' },
]

function requiredWorkspaceId(c: { req: { query: (name: string) => string | undefined } }) {
  const workspaceId = c.req.query('workspace_id')?.trim()
  if (!workspaceId || workspaceId.length > 120) throw new AppError('VALIDATION_ERROR', 'workspace_id query parameter is required.')
  return workspaceId
}

function requestedSections(c: { req: { query: (name: string) => string | undefined } }) {
  const raw = c.req.query('include')?.trim()
  if (!raw) return new Set(['projects', 'providers', 'tasks', 'docs'])
  const allowed = new Set(['projects', 'providers', 'tasks', 'docs'])
  const sections = new Set(raw.split(',').map((x) => x.trim()).filter((x) => allowed.has(x)))
  if (sections.size === 0) throw new AppError('VALIDATION_ERROR', 'include must contain projects, providers, tasks, or docs.')
  return sections
}

async function visibleTaskRows(env: AppEnv['Bindings'], principal: Parameters<typeof listVisibleVentures>[1], access: Parameters<typeof listVisibleVentures>[2]) {
  const ventures = await listVisibleVentures(env, principal, access)
  const ids = ventures.map((v) => String((v as { id: string }).id))
  if (ids.length === 0) return []
  return (await env.DB.prepare(
    `SELECT id, venture_id, objective, execution_mode, autonomy_level, status, status_reason, budget_credits, credits_used, created_at, updated_at
     FROM tasks WHERE venture_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at DESC LIMIT 200`,
  ).bind(...ids).all()).results
}

export function registerConnectRoutes(app: Hono<AppEnv>) {
  app.get('/connect/manifest', (c) => ok(c, {
    name: 'MAELVYN Connect',
    version: '1',
    mode: 'read_only_by_default',
    authentication: 'Bearer Clerk session token; no unauthenticated Connect endpoints.',
    authorization: 'Workspace and venture scope are resolved from database membership, never client claims.',
    writes: 'Only scoped status proposals are accepted. They are recorded as pending and require human review; core task state is never mutated by Connect.',
    audit: 'Every write proposal creates an audit event with the request id and actor identity.',
    rate_limits: 'Connect writes use the same D1-backed request rate-limit primitives as the core API.',
    tools: TOOL_CATALOG,
  }))

  app.get('/connect/registry', async (c) => {
    const p = principalOf(c)
    const workspaceId = requiredWorkspaceId(c)
    const access = await authorizeWorkspace(c.env, p, workspaceId, 'workspace.read', c.get('requestId'))
    const sections = requestedSections(c)
    const workspace = await c.env.DB.prepare(`SELECT id, name, slug, status, is_synthetic, default_currency FROM workspaces WHERE id = ?`).bind(workspaceId).first()
    const response: Record<string, unknown> = {
      workspace,
      scope: isWorkspaceWide(access.role) ? 'workspace' : 'assigned_ventures_only',
      role: access.role,
      registry_version: '1',
    }
    if (sections.has('projects')) response.projects = await listVisibleVentures(c.env, p, access)
    if (sections.has('providers')) {
      response.providers = (await c.env.DB.prepare(
        `SELECT r.id, r.display_name, r.kind, r.capabilities_json, r.docs_url, r.pricing_note, r.is_external,
                COALESCE(s.live_enabled, 0) AS live_enabled, COALESCE(s.paid_execution_allowed, 0) AS paid_execution_allowed,
                COALESCE(s.last_health_status, 'UNVERIFIED') AS last_health_status, s.last_health_at
         FROM provider_registry r LEFT JOIN workspace_provider_settings s ON s.provider_id = r.id AND s.workspace_id = ?
         ORDER BY r.is_external, r.id`,
      ).bind(workspaceId).all<Record<string, unknown>>()).results.map((row) => ({
        ...row,
        capabilities: JSON.parse(String(row.capabilities_json)),
        capabilities_json: undefined,
      }))
    }
    if (sections.has('tasks')) response.tasks = await visibleTaskRows(c.env, p, access)
    if (sections.has('docs')) response.docs = DOCS
    return ok(c, response)
  })

  app.get('/connect/status-proposals', async (c) => {
    const p = principalOf(c)
    const workspaceId = requiredWorkspaceId(c)
    const access = await authorizeWorkspace(c.env, p, workspaceId, 'workspace.read', c.get('requestId'))
    const ventures = await listVisibleVentures(c.env, p, access)
    const ids = ventures.map((v) => String((v as { id: string }).id))
    if (ids.length === 0) return ok(c, { proposals: [], scope: 'assigned_ventures_only' })
    const rows = (await c.env.DB.prepare(
      `SELECT id, venture_id, task_id, title, requested_status, note, source, status, created_at, updated_at
       FROM connect_status_proposals WHERE workspace_id = ? AND venture_id IN (${ids.map(() => '?').join(',')})
       ORDER BY created_at DESC LIMIT 200`,
    ).bind(workspaceId, ...ids).all()).results
    return ok(c, { proposals: rows, scope: isWorkspaceWide(access.role) ? 'workspace' : 'assigned_ventures_only' })
  })

  app.post('/connect/status-proposals', async (c) => {
    const p = principalOf(c)
    await rateLimit(c.env, `connect-proposal:${p.personId}`, 20)
    const body = await parseJson(c, z.object({
      workspace_id: z.string().trim().min(1).max(120),
      venture_id: z.string().trim().min(1).max(120),
      task_id: z.string().trim().min(1).max(120).optional(),
      title: z.string().trim().min(3).max(160),
      requested_status: CONNECT_STATUS,
      note: z.string().trim().max(2000).optional(),
      source: z.enum(['api', 'mcp']).default('api'),
    }).strict())
    const access = await authorizeVenture(c.env, p, body.venture_id, 'venture.manage', c.get('requestId'))
    if (access.workspaceId !== body.workspace_id) throw new AppError('NOT_FOUND', 'Venture not found.')
    if (body.task_id) {
      const task = await c.env.DB.prepare(`SELECT id FROM tasks WHERE id = ? AND venture_id = ?`).bind(body.task_id, body.venture_id).first()
      if (!task) throw new AppError('NOT_FOUND', 'Task not found.')
    }
    const id = newId('csp')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO connect_status_proposals (id, workspace_id, venture_id, task_id, title, requested_status, note, source, requested_by_person_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      ).bind(id, body.workspace_id, body.venture_id, body.task_id ?? null, body.title, body.requested_status, body.note ?? null, body.source, p.personId, ts, ts),
      auditStatement(c.env, {
        workspaceId: body.workspace_id,
        ventureId: body.venture_id,
        actorPersonId: p.personId,
        action: 'connect.status_proposal.created',
        targetType: 'connect_status_proposal',
        targetId: id,
        requestId: c.get('requestId'),
        metadata: { task_id: body.task_id ?? null, requested_status: body.requested_status, source: body.source },
      }),
    ])
    return ok(c, { proposal: { id, ...body, status: 'pending', created_at: ts, updated_at: ts }, review_required: true }, 201)
  })
}
