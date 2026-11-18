import type { Hono } from 'hono'
import { listVisibleVentures } from '../authorization/policy'
import type { AppEnv, Env } from '../env'
import { ok } from '../lib/http'
import { workspaceCtx } from '../lib/scope'

const EVIDENCE_WINDOW_DAYS = 90
const CRITICAL_GATE_CATEGORIES = ['governance', 'legal', 'financial', 'privacy', 'security']

/**
 * EBAV per docs/MASTER-SYSTEM.md §10 — a venture counts only when ALL hold:
 * 1) stage build/launch/operate; 2) accountable human operator; 3) approved charter AND approved budget;
 * 4) recent reviewable evidence (≤90 days); 5) no open critical governance/legal/financial/privacy/security risk
 *    and no open reserved-matter approval blocking it.
 */
export async function ebavCheck(env: Env, ventureId: string) {
  const since = new Date(Date.now() - EVIDENCE_WINDOW_DAYS * 86400_000).toISOString()
  const r = await env.DB.prepare(
    `SELECT v.stage, v.accountable_person_id,
      (SELECT COUNT(*) FROM venture_members vm WHERE vm.venture_id = v.id AND vm.person_id = v.accountable_person_id AND vm.status = 'active') AS operator_active,
      (SELECT COUNT(*) FROM venture_charters WHERE venture_id = v.id AND status = 'approved') AS charter,
      (SELECT COUNT(*) FROM budgets WHERE venture_id = v.id AND status = 'approved') AS budget,
      (SELECT COUNT(*) FROM research_artifacts ra JOIN tasks t ON t.id = ra.task_id WHERE ra.venture_id = v.id AND ra.status = 'accepted' AND t.execution_mode = 'live' AND ra.reviewed_at >= ?2)
       + (SELECT COUNT(*) FROM experiments WHERE venture_id = v.id AND status = 'concluded' AND concluded_at >= ?2)
       + (SELECT COUNT(*) FROM venture_reviews WHERE venture_id = v.id AND created_at >= ?2)
       + (SELECT COUNT(*) FROM orders WHERE venture_id = v.id AND status IN ('confirmed','fulfilled') AND created_at >= ?2) AS evidence,
      (SELECT COUNT(*) FROM venture_risks WHERE venture_id = v.id AND status = 'open' AND severity = 'critical' AND category IN (${CRITICAL_GATE_CATEGORIES.map((x) => `'${x}'`).join(',')})) AS critical_risks
     FROM ventures v WHERE v.id = ?1`,
  ).bind(ventureId, since).first<{ stage: string; accountable_person_id: string | null; operator_active: number; charter: number; budget: number; evidence: number; critical_risks: number }>()
  const checks = {
    stage_build_launch_operate: ['build', 'launch', 'operate'].includes(r!.stage),
    accountable_operator: !!r!.accountable_person_id && r!.operator_active > 0,
    approved_charter: r!.charter > 0,
    approved_budget: r!.budget > 0,
    recent_evidence: r!.evidence > 0,
    no_critical_gate: r!.critical_risks === 0,
  }
  return { counts: Object.values(checks).every(Boolean), checks }
}

export function registerPortfolioRoutes(app: Hono<AppEnv>) {
  app.get('/workspaces/:wid/portfolio', async (c) => {
    const { p, access } = await workspaceCtx(c, 'workspace.read')
    const ventures = await listVisibleVentures(c.env, p, access) as { id: string; name: string; code: string; stage: string; status: string }[]
    const rows = await Promise.all(ventures.map(async (v) => ({ ...v, ebav: await ebavCheck(c.env, v.id) })))
    const pending = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM approval_requests WHERE workspace_id = ? AND status = 'submitted'`).bind(access.workspaceId).first<{ n: number }>()
    const byStage: Record<string, number> = {}
    for (const v of rows) byStage[v.stage] = (byStage[v.stage] ?? 0) + 1
    return ok(c, {
      ebav: rows.filter((v) => v.ebav.counts).length,
      ebav_definition: 'docs/MASTER-SYSTEM.md §10: build/launch/operate + accountable operator + approved charter & budget + evidence ≤90 days + no open critical gate',
      ventures: rows, by_stage: byStage, pending_approvals: pending?.n ?? 0, scope: access.role === 'workspace_admin' || access.role === 'governance_approver' ? 'workspace' : 'assigned_ventures_only',
    })
  })
}
