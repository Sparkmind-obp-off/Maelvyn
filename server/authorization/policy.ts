import type { Env, Principal } from '../env'
import { AppError, newId, nowIso } from '../lib/http'

export type WorkspaceRole = 'workspace_admin' | 'governance_approver' | 'venture_operator' | 'finance_operator' | 'viewer'

export type Action =
  | 'workspace.read' | 'workspace.audit.read' | 'workspace.providers.manage' | 'workspace.killswitch.manage'
  | 'workspace.members.manage' | 'venture.create' | 'venture.read' | 'research.create' | 'research.review'

/** Workspace-level capability matrix (docs/API-CONTRACT.md, narrowed for the first slice). */
const WORKSPACE_ACTIONS: Record<WorkspaceRole, Action[]> = {
  workspace_admin: ['workspace.read', 'workspace.audit.read', 'workspace.providers.manage', 'workspace.killswitch.manage', 'workspace.members.manage', 'venture.create', 'venture.read', 'research.create', 'research.review'],
  governance_approver: ['workspace.read', 'workspace.audit.read', 'venture.create', 'venture.read', 'research.create', 'research.review'],
  venture_operator: ['workspace.read', 'venture.create', 'venture.read', 'research.create', 'research.review'],
  finance_operator: ['workspace.read', 'venture.read'],
  viewer: ['workspace.read', 'venture.read'],
}

/** Roles that see every venture in a workspace. Everyone else needs an explicit active venture membership. */
const WORKSPACE_WIDE: WorkspaceRole[] = ['workspace_admin', 'governance_approver']

export type WorkspaceAccess = { workspaceId: string; role: WorkspaceRole }
export type VentureAccess = WorkspaceAccess & { ventureId: string; ventureMember: boolean }

async function recordDecision(env: Env, p: { workspaceId?: string | null; ventureId?: string | null; personId: string; action: string; decision: 'allow' | 'deny'; reason: string; requestId: string }) {
  await env.DB.prepare(
    `INSERT INTO permission_decisions (id, workspace_id, venture_id, person_id, action, decision, reason, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(newId('pdc'), p.workspaceId ?? null, p.ventureId ?? null, p.personId, p.action, p.decision, p.reason, p.requestId, nowIso()).run()
}

/**
 * Resolve workspace role from the DATABASE (never from client claims) and check the action.
 * Unknown workspace and non-membership return the same NOT_FOUND to avoid leaking existence.
 */
export async function authorizeWorkspace(env: Env, principal: Principal, workspaceId: string, action: Action, requestId: string): Promise<WorkspaceAccess> {
  const m = await env.DB.prepare(
    `SELECT wm.role FROM workspace_members wm JOIN workspaces w ON w.id = wm.workspace_id
     WHERE wm.workspace_id = ? AND wm.person_id = ? AND wm.status = 'active' AND w.status IN ('setup','active')`,
  ).bind(workspaceId, principal.personId).first<{ role: WorkspaceRole }>()
  if (!m) {
    await recordDecision(env, { workspaceId: null, personId: principal.personId, action, decision: 'deny', reason: 'no_active_membership', requestId })
    throw new AppError('NOT_FOUND', 'Workspace not found.')
  }
  if (!WORKSPACE_ACTIONS[m.role].includes(action)) {
    await recordDecision(env, { workspaceId, personId: principal.personId, action, decision: 'deny', reason: `role_${m.role}_lacks_${action}`, requestId })
    throw new AppError('FORBIDDEN', 'You do not have permission to perform this action.')
  }
  return { workspaceId, role: m.role }
}

/** Venture-scoped authorization: workspace role + (workspace-wide role OR active venture membership). */
export async function authorizeVenture(env: Env, principal: Principal, ventureId: string, action: Action, requestId: string): Promise<VentureAccess> {
  const v = await env.DB.prepare(`SELECT workspace_id FROM ventures WHERE id = ?`).bind(ventureId).first<{ workspace_id: string }>()
  if (!v) throw new AppError('NOT_FOUND', 'Venture not found.')
  let ws: WorkspaceAccess
  try {
    ws = await authorizeWorkspace(env, principal, v.workspace_id, action, requestId)
  } catch (e) {
    if (e instanceof AppError && e.code === 'NOT_FOUND') throw new AppError('NOT_FOUND', 'Venture not found.')
    throw e
  }
  const vm = await env.DB.prepare(
    `SELECT 1 AS ok FROM venture_members WHERE venture_id = ? AND person_id = ? AND status = 'active' LIMIT 1`,
  ).bind(ventureId, principal.personId).first<{ ok: number }>()
  const member = !!vm
  if (!member && !WORKSPACE_WIDE.includes(ws.role)) {
    await recordDecision(env, { workspaceId: ws.workspaceId, ventureId, personId: principal.personId, action, decision: 'deny', reason: 'cross_venture_access_denied', requestId })
    throw new AppError('NOT_FOUND', 'Venture not found.')
  }
  return { ...ws, ventureId, ventureMember: member }
}

/** Ventures visible to a principal inside a workspace (access enforced BEFORE retrieval). */
export async function listVisibleVentures(env: Env, principal: Principal, access: WorkspaceAccess) {
  const wide = WORKSPACE_WIDE.includes(access.role)
  const sql = wide
    ? `SELECT id, code, name, description, category, stage, status, created_at FROM ventures WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200`
    : `SELECT v.id, v.code, v.name, v.description, v.category, v.stage, v.status, v.created_at FROM ventures v
       JOIN venture_members vm ON vm.venture_id = v.id AND vm.person_id = ? AND vm.status = 'active'
       WHERE v.workspace_id = ? GROUP BY v.id ORDER BY v.created_at DESC LIMIT 200`
  const stmt = wide ? env.DB.prepare(sql).bind(access.workspaceId) : env.DB.prepare(sql).bind(principal.personId, access.workspaceId)
  return (await stmt.all()).results
}
