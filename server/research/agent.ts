import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import { assertNotKilled } from '../authorization/killswitch'
import type { VentureAccess } from '../authorization/policy'
import type { Env, Principal } from '../env'
import { AppError, newId, nowIso, safeHttpUrl, sanitizeText, sha256Hex, todayUtc } from '../lib/http'
import { routeProvider } from '../providers/router'
import { ProviderError, type Capability, type CallContext } from '../providers/types'
import { buildBrief, detectInjection, type EvidenceForBrief } from './brief'

export const CreateResearchInput = z.object({
  objective: z.string().trim().min(10).max(400),
  /** Resolved by the route: Production defaults to real ('live') evidence; other environments to 'synthetic'. */
  mode: z.enum(['synthetic', 'live']).optional(),
  max_results: z.number().int().min(1).max(5).default(5),
  extract_top_source: z.boolean().default(false),
  budget_credits: z.number().int().min(0).max(10).default(3),
})
export type CreateResearchInput = z.infer<typeof CreateResearchInput>
/** Mode is always resolved before execution — Production never silently produces synthetic evidence. */
export type ResearchInput = CreateResearchInput & { mode: 'synthetic' | 'live' }

type AgentVersion = { id: string; agent_id: string; version: string; autonomy_level: string; tool_allowlist_json: string; data_classes_json: string; max_task_credits: number }

export type RunDeps = { fetchImpl?: typeof fetch; timeoutMs?: number }

async function currentAgent(env: Env): Promise<AgentVersion> {
  const a = await env.DB.prepare(
    `SELECT v.* FROM agent_versions v JOIN agent_registry r ON r.id = v.agent_id
     WHERE r.id = 'research-brief' AND r.status = 'active' AND v.is_current = 1`,
  ).first<AgentVersion>()
  if (!a) throw new AppError('FORBIDDEN', 'Research Brief Agent is not active.')
  return a
}

function exec(env: Env, taskId: string, step: string, providerId: string | null, status: string, detail: Record<string, unknown>, started: string) {
  return env.DB.prepare(
    `INSERT INTO task_executions (id, task_id, step, provider_id, status, attempt, detail_json, started_at, finished_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  ).bind(newId('tex'), taskId, step, providerId, status, JSON.stringify(detail).slice(0, 4000), started, nowIso())
}

function usage(env: Env, p: { workspaceId: string; ventureId: string; taskId: string; providerId: string; capability: string; estimated: number; actual: number | null; outcome: string; errorClass?: string | null; durationMs: number; requestId: string }) {
  return env.DB.prepare(
    `INSERT INTO provider_usage (id, workspace_id, venture_id, task_id, provider_id, capability, estimated_credits, actual_credits, outcome, error_class, duration_ms, request_id, usage_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(newId('use'), p.workspaceId, p.ventureId, p.taskId, p.providerId, p.capability, p.estimated, p.actual, p.outcome, p.errorClass ?? null, p.durationMs, p.requestId, todayUtc(), nowIso())
}

/**
 * Creates and synchronously runs one Research Brief task (L2 Prepare: it only drafts; a human reviews).
 * Idempotent per (workspace, Idempotency-Key): a replay with the same body returns the same task;
 * a replay with a different body is rejected.
 */
export async function createAndRunResearch(
  env: Env, principal: Principal, access: VentureAccess, input: ResearchInput, idempotencyKey: string, requestId: string, deps: RunDeps = {},
): Promise<{ taskId: string; replayed: boolean }> {
  const requestHash = await sha256Hex(JSON.stringify({ v: access.ventureId, ...input }))
  const scope = `research:${access.workspaceId}`
  const prior = await env.DB.prepare(`SELECT request_hash, response_json FROM idempotency_records WHERE scope = ? AND idem_key = ?`)
    .bind(scope, idempotencyKey).first<{ request_hash: string; response_json: string }>()
  if (prior) {
    if (prior.request_hash !== requestHash) throw new AppError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was already used with a different request.')
    return { taskId: (JSON.parse(prior.response_json) as { task_id: string }).task_id, replayed: true }
  }

  const agent = await currentAgent(env)
  await assertNotKilled(env, access.workspaceId, [`agent:${agent.agent_id}`])
  const allowlist = JSON.parse(agent.tool_allowlist_json) as Capability[]
  const budget = Math.min(input.budget_credits, agent.max_task_credits)
  const taskId = newId('tsk')
  const ts = nowIso()
  const contract = {
    task_id: taskId, parent_task_id: null, venture_id: access.ventureId, workspace_id: access.workspaceId,
    requester: principal.personId, human_owner: principal.personId, objective: input.objective,
    deliverable: 'Draft research brief with cited sources, separated facts vs. inferences',
    acceptance_criteria: ['Every finding cites a stored source', 'Inferences labelled', 'Gaps listed', 'Human review recorded'],
    read_scopes: [`venture:${access.ventureId}`], write_scopes: [`venture:${access.ventureId}:research`],
    tool_allowlist: allowlist, data_class: 'public', autonomy_level: agent.autonomy_level,
    provider_policy: input.mode === 'synthetic' ? 'mock-only' : 'approved-live-only; no automatic fallback',
    budget_ceiling_credits: budget, deadline_seconds: 60, retry_policy: 'no automatic retry for paid calls',
    approvals: ['human review of draft brief'], agent_version: `${agent.agent_id}@${agent.version}`,
  }

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO tasks (id, parent_task_id, workspace_id, venture_id, agent_version_id, task_type, objective, requested_by_person_id, human_owner_person_id, data_class, autonomy_level, execution_mode, contract_json, budget_credits, credits_used, status, idempotency_key, created_at, updated_at)
         VALUES (?, NULL, ?, ?, ?, 'research_brief', ?, ?, ?, 'public', ?, ?, ?, ?, 0, 'running', ?, ?, ?)`,
      ).bind(taskId, access.workspaceId, access.ventureId, agent.id, input.objective, principal.personId, principal.personId, agent.autonomy_level, input.mode, JSON.stringify(contract), budget, idempotencyKey, ts, ts),
      env.DB.prepare(`INSERT INTO idempotency_records (scope, idem_key, request_hash, response_status, response_json, created_at) VALUES (?, ?, ?, 201, ?, ?)`)
        .bind(scope, idempotencyKey, requestHash, JSON.stringify({ task_id: taskId }), ts),
      auditStatement(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: principal.personId, action: 'task.created', targetType: 'task', targetId: taskId, requestId, metadata: { mode: input.mode, budget, agent: contract.agent_version } }),
      exec(env, taskId, 'policy', null, 'succeeded', { decision: 'allow', role: access.role, venture_member: access.ventureMember, autonomy: agent.autonomy_level }, ts),
    ])
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw new AppError('IDEMPOTENCY_CONFLICT', 'A task with this Idempotency-Key already exists.')
    throw e
  }

  const ctx: CallContext = { idempotencyKey: `${taskId}`, timeoutMs: deps.timeoutMs ?? 20000, fetchImpl: deps.fetchImpl }
  let creditsUsed = 0
  const finish = async (status: string, reason: string | null) => {
    await env.DB.batch([
      env.DB.prepare(`UPDATE tasks SET status = ?, status_reason = ?, credits_used = ?, updated_at = ? WHERE id = ?`).bind(status, reason, creditsUsed, nowIso(), taskId),
      auditStatement(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: null, action: `task.${status}`, targetType: 'task', targetId: taskId, requestId, reason, metadata: { credits_used: creditsUsed } }),
    ])
  }

  // ---- Step: search -------------------------------------------------------
  const evidence: EvidenceForBrief[] = []
  let searchProvider: string
  {
    const started = nowIso()
    let route
    try {
      route = await routeProvider(env, { workspaceId: access.workspaceId, capability: 'search.web', mode: input.mode, agentAllowlist: allowlist, remainingTaskBudget: budget - creditsUsed })
      await assertNotKilled(env, access.workspaceId, [`provider:${route.adapter.id}`])
    } catch (e) {
      const err = e instanceof AppError ? e : new AppError('INTERNAL_ERROR', 'Routing failed.')
      await env.DB.batch([
        exec(env, taskId, 'search', null, 'denied', { code: err.code, message: err.message }, started),
        auditStatement(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, action: 'provider.call.denied', targetType: 'task', targetId: taskId, requestId, reason: err.code, metadata: err.details }),
      ])
      await finish('blocked', `${err.code}: ${err.message}`)
      return { taskId, replayed: false }
    }
    searchProvider = route.adapter.id
    const t0 = Date.now()
    try {
      const out = await route.adapter.search!(env, { query: input.objective, maxResults: input.max_results }, ctx)
      creditsUsed += route.estimate
      let n = 0
      const stmts = []
      for (const h of out.hits) {
        const url = safeHttpUrl(h.url)
        if (!url) continue
        n += 1
        const title = sanitizeText(h.title, 300) || url
        const snippet = sanitizeText(h.snippet, 1500)
        const flag = detectInjection(`${title} ${snippet}`)
        evidence.push({ n, url, title, snippet, synthetic: out.synthetic, injectionFlag: flag })
        stmts.push(env.DB.prepare(
          `INSERT INTO evidence_sources (id, workspace_id, venture_id, task_id, provider_id, query, url, title, snippet, extracted_excerpt, relevance_score, evidence_class, trust, retrieved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
        ).bind(newId('evd'), access.workspaceId, access.ventureId, taskId, route.adapter.id, input.objective, url, title, snippet, h.score,
          out.synthetic ? 'synthetic' : 'secondary_unverified', out.synthetic ? 'synthetic' : 'untrusted_external', nowIso()))
      }
      stmts.push(exec(env, taskId, 'search', route.adapter.id, 'succeeded', { hits: n, synthetic: out.synthetic, provider_request_id: out.providerRequestId ?? null }, started))
      stmts.push(usage(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, taskId, providerId: route.adapter.id, capability: 'search.web', estimated: route.estimate, actual: route.estimate, outcome: 'succeeded', durationMs: Date.now() - t0, requestId }))
      stmts.push(auditStatement(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, action: 'provider.call.succeeded', targetType: 'task', targetId: taskId, requestId, metadata: { provider: route.adapter.id, capability: 'search.web', hits: n, credits: route.estimate } }))
      await env.DB.batch(stmts)
    } catch (e) {
      const pe = e instanceof ProviderError ? e : null
      await env.DB.batch([
        exec(env, taskId, 'search', route.adapter.id, 'failed', { error_class: pe?.errorClass ?? 'unknown', http_status: pe?.httpStatus ?? null }, started),
        usage(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, taskId, providerId: route.adapter.id, capability: 'search.web', estimated: route.estimate, actual: null, outcome: 'failed', errorClass: pe?.errorClass ?? 'unknown', durationMs: Date.now() - t0, requestId }),
        auditStatement(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, action: 'provider.call.failed', targetType: 'task', targetId: taskId, requestId, reason: pe?.errorClass ?? 'unknown', metadata: { provider: route.adapter.id } }),
      ])
      await finish('failed', `Search provider error: ${pe?.errorClass ?? 'unknown'}. No fallback provider was used.`)
      return { taskId, replayed: false }
    }
  }

  // ---- Step: optional extraction (live only, explicitly requested) --------
  const top = evidence.find((e) => !e.injectionFlag)
  if (input.extract_top_source && input.mode === 'live' && top) {
    const started = nowIso()
    try {
      const route = await routeProvider(env, { workspaceId: access.workspaceId, capability: 'extract.page', mode: 'live', agentAllowlist: allowlist, remainingTaskBudget: budget - creditsUsed })
      await assertNotKilled(env, access.workspaceId, [`provider:${route.adapter.id}`])
      const t0 = Date.now()
      try {
        const out = await route.adapter.extract!(env, { url: top.url }, ctx)
        creditsUsed += route.estimate
        const excerpt = sanitizeText(out.excerpt, 3000)
        const flag = detectInjection(excerpt)
        top.excerpt = flag ? null : excerpt
        if (flag) top.injectionFlag = true
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO evidence_sources (id, workspace_id, venture_id, task_id, provider_id, query, url, title, snippet, extracted_excerpt, relevance_score, evidence_class, trust, retrieved_at)
             VALUES (?, ?, ?, ?, 'firecrawl', ?, ?, ?, NULL, ?, NULL, 'secondary_unverified', 'untrusted_external', ?)`,
          ).bind(newId('evd'), access.workspaceId, access.ventureId, taskId, input.objective, top.url, sanitizeText(out.title, 300) || top.title, excerpt, nowIso()),
          exec(env, taskId, 'extract', route.adapter.id, 'succeeded', { url: top.url, chars: excerpt.length, injection_flag: flag }, started),
          usage(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, taskId, providerId: route.adapter.id, capability: 'extract.page', estimated: route.estimate, actual: route.estimate, outcome: 'succeeded', durationMs: Date.now() - t0, requestId }),
          auditStatement(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, action: 'provider.call.succeeded', targetType: 'task', targetId: taskId, requestId, metadata: { provider: route.adapter.id, capability: 'extract.page', credits: route.estimate } }),
        ])
      } catch (e) {
        const pe = e instanceof ProviderError ? e : null
        await env.DB.batch([
          exec(env, taskId, 'extract', route.adapter.id, 'failed', { error_class: pe?.errorClass ?? 'unknown' }, started),
          usage(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, taskId, providerId: route.adapter.id, capability: 'extract.page', estimated: route.estimate, actual: null, outcome: 'failed', errorClass: pe?.errorClass ?? 'unknown', durationMs: Date.now() - t0, requestId }),
        ])
      }
    } catch (e) {
      const err = e instanceof AppError ? e : new AppError('INTERNAL_ERROR', 'Routing failed.')
      await exec(env, taskId, 'extract', null, 'skipped', { code: err.code, message: err.message }, started).run()
    }
  }

  // ---- Step: synthesize draft brief ----------------------------------------
  const started = nowIso()
  const brief = buildBrief(input.objective, evidence)
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO research_artifacts (id, workspace_id, venture_id, task_id, title, brief_json, generator, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'extractive-v1', 'draft', ?)`)
      .bind(newId('art'), access.workspaceId, access.ventureId, taskId, `Research brief: ${input.objective.slice(0, 120)}`, JSON.stringify(brief), nowIso()),
    exec(env, taskId, 'synthesize', null, 'succeeded', { findings: brief.reported_findings.length, sources: brief.sources.length, search_provider: searchProvider }, started),
  ])
  await finish('awaiting_review', null)
  return { taskId, replayed: false }
}

export const ReviewInput = z.object({ decision: z.enum(['accept', 'reject']), note: z.string().trim().max(1000).optional() })

/** Human review: only a human principal with research.review may accept/reject; agents never self-approve. */
export async function reviewResearch(env: Env, principal: Principal, access: VentureAccess, taskId: string, input: z.infer<typeof ReviewInput>, requestId: string) {
  const task = await env.DB.prepare(`SELECT status FROM tasks WHERE id = ? AND venture_id = ?`).bind(taskId, access.ventureId).first<{ status: string }>()
  if (!task) throw new AppError('NOT_FOUND', 'Task not found.')
  if (task.status !== 'awaiting_review') throw new AppError('CONFLICT', `Task is ${task.status}; only drafts awaiting review can be reviewed.`)
  const newStatus = input.decision === 'accept' ? 'accepted' : 'rejected'
  const ts = nowIso()
  await env.DB.batch([
    env.DB.prepare(`UPDATE research_artifacts SET status = ?, reviewed_by_person_id = ?, review_note = ?, reviewed_at = ? WHERE task_id = ? AND status = 'draft'`)
      .bind(newStatus, principal.personId, input.note ?? null, ts, taskId),
    env.DB.prepare(`UPDATE tasks SET status = ?, updated_at = ? WHERE id = ? AND status = 'awaiting_review'`).bind(newStatus, ts, taskId),
    exec(env, taskId, 'review', null, 'succeeded', { decision: input.decision, reviewer: principal.personId }, ts),
    auditStatement(env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: principal.personId, action: `research.${newStatus}`, targetType: 'task', targetId: taskId, requestId, reason: input.note ?? null }),
  ])
  return newStatus
}
