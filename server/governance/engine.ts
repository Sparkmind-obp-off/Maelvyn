import { auditStatement } from '../audit/audit'
import type { WorkspaceRole } from '../authorization/policy'
import type { Env, Principal } from '../env'
import { AppError, newId, nowIso, sha256Hex } from '../lib/http'
import { notifyStatements } from '../lib/notify'

/**
 * Approval engine for reserved matters. Rules:
 * - Only authorized humans vote; agents never vote. The requester and the subject of a request never vote.
 * - Anyone who declares a conflict of interest is excluded from voting on that request.
 * - Any eligible `reject` rejects the request; `required_approvals` approves trigger execution.
 * - The target record is snapshotted (hash) at submission; if it changed, the request is superseded, not executed.
 * - Approval executes only the recorded state change on MAELVYN records. It never moves money or signs anything.
 */
export type RequestType = 'charter_approval' | 'stage_transition' | 'budget_approval' | 'contribution_acceptance'
  | 'agreement_execution' | 'ownership_effective' | 'asset_disposal'

const GOV: WorkspaceRole[] = ['workspace_admin', 'governance_approver']
type TypeDef = { target: string; eligible: WorkspaceRole[]; minApprovals: number; label: string }
export const REQUEST_TYPES: Record<RequestType, TypeDef> = {
  charter_approval: { target: 'venture_charters', eligible: GOV, minApprovals: 1, label: 'Charter approval' },
  stage_transition: { target: 'ventures', eligible: GOV, minApprovals: 1, label: 'Stage transition' },
  budget_approval: { target: 'budgets', eligible: GOV, minApprovals: 1, label: 'Budget approval' },
  contribution_acceptance: { target: 'contributions', eligible: GOV, minApprovals: 1, label: 'Contribution acceptance' },
  agreement_execution: { target: 'agreements', eligible: GOV, minApprovals: 1, label: 'Agreement execution' },
  ownership_effective: { target: 'ownership_interests', eligible: GOV, minApprovals: 2, label: 'Ownership interest becomes effective' },
  asset_disposal: { target: 'assets', eligible: GOV, minApprovals: 1, label: 'Asset disposal' },
}

/** Material fields of the target, hashed at submission and re-checked before execution. */
async function snapshot(env: Env, type: RequestType, targetId: string): Promise<string> {
  const q: Record<RequestType, string> = {
    charter_approval: `SELECT id, venture_id, version, content_json FROM venture_charters WHERE id = ?`,
    stage_transition: `SELECT id, stage FROM ventures WHERE id = ?`,
    budget_approval: `SELECT b.id, b.currency, b.cap_minor, b.period_start, b.period_end, (SELECT group_concat(category || ':' || amount_minor, '|') FROM budget_lines WHERE budget_id = b.id) AS lines FROM budgets b WHERE b.id = ?`,
    contribution_acceptance: `SELECT id, contribution_type, legal_character, description, currency, agreed_value_minor, valuation_method FROM contributions WHERE id = ?`,
    agreement_execution: `SELECT a.id, a.title, a.version, a.agreement_type, a.summary, (SELECT group_concat(person_id || ':' || party_role || ':' || signature_status, '|') FROM agreement_parties WHERE agreement_id = a.id) AS parties FROM agreements a WHERE a.id = ?`,
    ownership_effective: `SELECT id, holder_person_id, agreement_id, interest_type, quantity, percentage_basis_points FROM ownership_interests WHERE id = ?`,
    asset_disposal: `SELECT id, asset_name, ownership_basis, custodian_person_id FROM assets WHERE id = ?`,
  }
  const row = await env.DB.prepare(q[type]).bind(targetId).first()
  if (!row) throw new AppError('NOT_FOUND', 'Approval target not found.')
  return sha256Hex(JSON.stringify(row))
}

async function eligibleVoters(env: Env, workspaceId: string, roles: WorkspaceRole[], exclude: string[]) {
  const rows = (await env.DB.prepare(
    `SELECT wm.person_id, wm.role FROM workspace_members wm WHERE wm.workspace_id = ? AND wm.status = 'active'
     AND (wm.role <> 'workspace_admin' OR EXISTS (SELECT 1 FROM platform_roles pr WHERE pr.person_id = wm.person_id AND pr.role = 'platform_owner' AND pr.status = 'active'))`,
  ).bind(workspaceId).all<{ person_id: string; role: WorkspaceRole }>()).results
  return rows.filter((r) => roles.includes(r.role) && !exclude.includes(r.person_id)).map((r) => r.person_id)
}

function event(env: Env, requestId: string, ev: string, actor: string | null, detail?: Record<string, unknown>) {
  return env.DB.prepare(`INSERT INTO approval_events (id, approval_request_id, event, actor_person_id, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(newId('ape'), requestId, ev, actor, detail ? JSON.stringify(detail) : null, nowIso())
}

/** Target-state changes that accompany submission / withdrawal / rejection of each type. */
function targetStatus(env: Env, type: RequestType, targetId: string, phase: 'submitted' | 'reverted' | 'rejected', ventureId: string | null) {
  const ts = nowIso()
  const s: ReturnType<Env['DB']['prepare']>[] = []
  switch (type) {
    case 'charter_approval':
      s.push(env.DB.prepare(`UPDATE venture_charters SET status = ?, updated_at = ? WHERE id = ?`).bind(phase === 'submitted' ? 'submitted' : phase === 'rejected' ? 'rejected' : 'draft', ts, targetId))
      if (ventureId) s.push(env.DB.prepare(`UPDATE ventures SET status = CASE WHEN status IN ('draft','pending_approval') THEN ? ELSE status END, updated_at = ? WHERE id = ?`).bind(phase === 'submitted' ? 'pending_approval' : 'draft', ts, ventureId))
      break
    case 'budget_approval':
      s.push(env.DB.prepare(`UPDATE budgets SET status = ? WHERE id = ?`).bind(phase === 'submitted' ? 'submitted' : phase === 'rejected' ? 'rejected' : 'draft', targetId))
      break
    case 'contribution_acceptance':
      s.push(env.DB.prepare(`UPDATE contributions SET status = ?, updated_at = ? WHERE id = ?`).bind(phase === 'submitted' ? 'under_review' : phase === 'rejected' ? 'rejected' : 'proposed', ts, targetId))
      break
    case 'agreement_execution':
      s.push(env.DB.prepare(`UPDATE agreements SET status = ?, updated_at = ? WHERE id = ?`).bind(phase === 'submitted' ? 'under_review' : 'draft', ts, targetId))
      break
    default:
      break
  }
  return s
}

export async function openRequestFor(env: Env, targetType: string, targetId: string) {
  return env.DB.prepare(`SELECT id FROM approval_requests WHERE target_type = ? AND target_id = ? AND status = 'submitted'`).bind(targetType, targetId).first<{ id: string }>()
}

export async function createApprovalRequest(env: Env, p: {
  principal: Principal; workspaceId: string; ventureId: string | null; type: RequestType; targetId: string; title: string; rationale: string
  payload?: Record<string, unknown>; subjectPersonId?: string | null; requiredApprovals?: number; expiresInDays?: number; requestId: string
}) {
  const def = REQUEST_TYPES[p.type]
  if (await openRequestFor(env, def.target, p.targetId)) throw new AppError('CONFLICT', 'An approval request for this record is already open.')
  const required = Math.max(def.minApprovals, Math.min(p.requiredApprovals ?? def.minApprovals, 5))
  const exclude = [p.principal.personId, ...(p.subjectPersonId ? [p.subjectPersonId] : [])]
  const voters = await eligibleVoters(env, p.workspaceId, def.eligible, exclude)
  if (voters.length < required) {
    throw new AppError('APPROVAL_REQUIRED', `Not enough eligible approvers (${voters.length}/${required}). Requesters and subjects cannot approve their own requests.`, { eligible: voters.length, required })
  }
  const id = newId('apr')
  const ts = nowIso()
  const expires = new Date(Date.now() + (p.expiresInDays ?? 14) * 86400_000).toISOString()
  const hash = await snapshot(env, p.type, p.targetId)
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO approval_requests (id, workspace_id, venture_id, request_type, target_type, target_id, title, rationale, requested_by_person_id, status, policy_snapshot,
        submitted_at, created_at, updated_at, required_approvals, eligible_roles_json, expires_at, payload_json, payload_hash, subject_person_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, p.workspaceId, p.ventureId, p.type, def.target, p.targetId, p.title, p.rationale, p.principal.personId,
      JSON.stringify({ eligible_roles: def.eligible, required_approvals: required, eligible_voters_at_submission: voters.length, separation_of_duties: true }),
      ts, ts, ts, required, JSON.stringify(def.eligible), expires, JSON.stringify(p.payload ?? {}), hash, p.subjectPersonId ?? null),
    event(env, id, 'submitted', p.principal.personId, { required }),
    ...targetStatus(env, p.type, p.targetId, 'submitted', p.ventureId),
    auditStatement(env, { workspaceId: p.workspaceId, ventureId: p.ventureId, actorPersonId: p.principal.personId, action: 'approval.submitted', targetType: def.target, targetId: p.targetId, requestId: p.requestId, reason: p.rationale, metadata: { approval_request_id: id, type: p.type, required } }),
    ...notifyStatements(env, voters, { workspaceId: p.workspaceId, kind: 'approval', title: `Approval needed: ${p.title}`, link: `/w/${p.workspaceId}/governance` }),
  ])
  return { id, required, eligible: voters.length }
}

type ReqRow = {
  id: string; workspace_id: string; venture_id: string | null; request_type: RequestType; target_id: string; title: string; status: string
  requested_by_person_id: string; required_approvals: number; eligible_roles_json: string; expires_at: string; payload_json: string; payload_hash: string; subject_person_id: string | null
}

async function loadRequest(env: Env, id: string) {
  const r = await env.DB.prepare(`SELECT * FROM approval_requests WHERE id = ?`).bind(id).first<ReqRow>()
  if (!r) throw new AppError('NOT_FOUND', 'Approval request not found.')
  return r
}

async function closeExpired(env: Env, r: ReqRow, requestId: string) {
  if (r.status === 'submitted' && r.expires_at <= nowIso()) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE approval_requests SET status = 'cancelled', closed_reason = 'expired', decided_at = ?, updated_at = ? WHERE id = ? AND status = 'submitted'`).bind(nowIso(), nowIso(), r.id),
      event(env, r.id, 'expired', null),
      ...targetStatus(env, r.request_type, r.target_id, 'reverted', r.venture_id),
      auditStatement(env, { workspaceId: r.workspace_id, ventureId: r.venture_id, action: 'approval.expired', targetType: 'approval_request', targetId: r.id, requestId }),
    ])
    return true
  }
  return false
}

export async function expireDue(env: Env, workspaceId: string, requestId: string) {
  const due = (await env.DB.prepare(`SELECT * FROM approval_requests WHERE workspace_id = ? AND status = 'submitted' AND expires_at <= ?`).bind(workspaceId, nowIso()).all<ReqRow>()).results
  for (const r of due) await closeExpired(env, r, requestId)
}

export async function declareConflict(env: Env, principal: Principal, id: string, description: string, requestId: string) {
  const r = await loadRequest(env, id)
  if (r.status !== 'submitted') throw new AppError('CONFLICT', `Request is ${r.status}.`)
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO conflict_declarations (id, approval_request_id, person_id, description, created_at) VALUES (?, ?, ?, ?, ?)`).bind(newId('coi'), id, principal.personId, description, nowIso()),
      event(env, id, 'conflict_declared', principal.personId, { description }),
      auditStatement(env, { workspaceId: r.workspace_id, ventureId: r.venture_id, actorPersonId: principal.personId, action: 'approval.conflict_declared', targetType: 'approval_request', targetId: id, requestId, reason: description }),
    ])
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw new AppError('CONFLICT', 'Conflict already declared.')
    throw e
  }
  return r
}

export async function withdrawRequest(env: Env, principal: Principal, id: string, reason: string, requestId: string) {
  const r = await loadRequest(env, id)
  if (r.requested_by_person_id !== principal.personId) throw new AppError('FORBIDDEN', 'Only the requester can withdraw a request.')
  if (r.status !== 'submitted') throw new AppError('CONFLICT', `Request is ${r.status}.`)
  await env.DB.batch([
    env.DB.prepare(`UPDATE approval_requests SET status = 'cancelled', closed_reason = ?, decided_at = ?, updated_at = ? WHERE id = ? AND status = 'submitted'`).bind(`withdrawn: ${reason}`, nowIso(), nowIso(), id),
    event(env, id, 'withdrawn', principal.personId, { reason }),
    ...targetStatus(env, r.request_type, r.target_id, 'reverted', r.venture_id),
    auditStatement(env, { workspaceId: r.workspace_id, ventureId: r.venture_id, actorPersonId: principal.personId, action: 'approval.withdrawn', targetType: 'approval_request', targetId: id, requestId, reason }),
  ])
}

export async function vote(env: Env, principal: Principal, role: WorkspaceRole, id: string, decision: 'approve' | 'reject' | 'abstain', rationale: string | undefined, requestId: string) {
  const r = await loadRequest(env, id)
  if (await closeExpired(env, r, requestId)) throw new AppError('CONFLICT', 'Request has expired.')
  if (r.status !== 'submitted') throw new AppError('CONFLICT', `Request is ${r.status}.`)
  if (r.requested_by_person_id === principal.personId) throw new AppError('FORBIDDEN', 'You cannot vote on your own request (separation of duties).')
  if (r.subject_person_id === principal.personId) throw new AppError('FORBIDDEN', 'You cannot vote on a request about your own rights or contribution.')
  if (!(JSON.parse(r.eligible_roles_json) as WorkspaceRole[]).includes(role)) throw new AppError('FORBIDDEN', 'Your role is not eligible to vote on this request.')
  const coi = await env.DB.prepare(`SELECT 1 AS ok FROM conflict_declarations WHERE approval_request_id = ? AND person_id = ?`).bind(id, principal.personId).first()
  if (coi) throw new AppError('FORBIDDEN', 'You declared a conflict of interest on this request and cannot vote.')
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO approval_votes (id, approval_request_id, voter_person_id, decision, rationale, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(newId('vot'), id, principal.personId, decision, rationale ?? null, nowIso()),
      event(env, id, 'vote', principal.personId, { decision }),
      auditStatement(env, { workspaceId: r.workspace_id, ventureId: r.venture_id, actorPersonId: principal.personId, action: `approval.vote_${decision}`, targetType: 'approval_request', targetId: id, requestId, reason: rationale ?? null }),
    ])
  } catch (e) {
    if (String(e).includes('UNIQUE')) throw new AppError('CONFLICT', 'You have already voted on this request.')
    throw e
  }
  const tally = await env.DB.prepare(`SELECT SUM(decision = 'approve') AS approve, SUM(decision = 'reject') AS reject FROM approval_votes WHERE approval_request_id = ?`).bind(id).first<{ approve: number; reject: number }>()
  if ((tally?.reject ?? 0) > 0) return finalize(env, r, 'rejected', requestId)
  if ((tally?.approve ?? 0) >= r.required_approvals) return finalize(env, r, 'approved', requestId)
  return 'submitted'
}

async function finalize(env: Env, r: ReqRow, outcome: 'approved' | 'rejected', requestId: string): Promise<string> {
  const ts = nowIso()
  if (outcome === 'approved' && (await snapshot(env, r.request_type, r.target_id)) !== r.payload_hash) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE approval_requests SET status = 'superseded', closed_reason = 'target changed after submission', decided_at = ?, updated_at = ? WHERE id = ?`).bind(ts, ts, r.id),
      event(env, r.id, 'superseded', null),
      ...targetStatus(env, r.request_type, r.target_id, 'reverted', r.venture_id),
      decisionStmt(env, r, 'superseded', 'Target changed after submission; resubmission required.'),
    ])
    return 'superseded'
  }
  let effects: ReturnType<Env['DB']['prepare']>[]
  if (outcome === 'approved') {
    try {
      effects = await executeEffects(env, r)
    } catch (e) {
      if (!(e instanceof AppError)) throw e
      // Preconditions no longer hold at execution time: close the request instead of leaving it half-decided.
      await env.DB.batch([
        env.DB.prepare(`UPDATE approval_requests SET status = 'superseded', closed_reason = ?, decided_at = ?, updated_at = ? WHERE id = ? AND status = 'submitted'`).bind(`not executable: ${e.message}`, ts, ts, r.id),
        event(env, r.id, 'superseded', null, { reason: e.message }),
        ...targetStatus(env, r.request_type, r.target_id, 'reverted', r.venture_id),
        decisionStmt(env, r, 'superseded', `Not executable: ${e.message}`),
        auditStatement(env, { workspaceId: r.workspace_id, ventureId: r.venture_id, action: 'approval.superseded', targetType: 'approval_request', targetId: r.id, requestId, reason: e.message }),
      ])
      return 'superseded'
    }
  } else effects = targetStatus(env, r.request_type, r.target_id, 'rejected', r.venture_id)
  const voters = (await env.DB.prepare(`SELECT voter_person_id, decision FROM approval_votes WHERE approval_request_id = ?`).bind(r.id).all()).results
  await env.DB.batch([
    env.DB.prepare(`UPDATE approval_requests SET status = ?, decided_at = ?, executed_at = ?, updated_at = ? WHERE id = ? AND status = 'submitted'`).bind(outcome, ts, outcome === 'approved' ? ts : null, ts, r.id),
    event(env, r.id, outcome, null, { votes: voters }),
    ...(outcome === 'approved' ? [event(env, r.id, 'executed', null, { effect: r.request_type })] : []),
    ...effects,
    decisionStmt(env, r, outcome, `${REQUEST_TYPES[r.request_type].label}: ${outcome}`, voters),
    auditStatement(env, { workspaceId: r.workspace_id, ventureId: r.venture_id, action: `approval.${outcome}`, targetType: REQUEST_TYPES[r.request_type].target, targetId: r.target_id, requestId, metadata: { approval_request_id: r.id, type: r.request_type } }),
    ...(r.venture_id && outcome === 'approved' ? [env.DB.prepare(
      `INSERT INTO memory_records (id, workspace_id, venture_id, kind, content, source_type, source_id, citations_json, confidence, sensitivity, status, created_by_person_id, created_at)
       VALUES (?, ?, ?, 'decision', ?, 'decision', ?, NULL, 'verified_decision', 'internal', 'active', NULL, ?)`,
    ).bind(newId('mem'), r.workspace_id, r.venture_id, `Approved decision: ${r.title}`, r.id, ts)] : []),
    ...notifyStatements(env, [r.requested_by_person_id, r.subject_person_id], { workspaceId: r.workspace_id, kind: 'decision', title: `${r.title}: ${outcome}`, link: `/w/${r.workspace_id}/governance` }),
  ])
  return outcome
}

function decisionStmt(env: Env, r: ReqRow, outcome: string, summary: string, votes: unknown[] = []) {
  return env.DB.prepare(
    `INSERT INTO decisions (id, workspace_id, venture_id, approval_request_id, decision_type, title, outcome, summary, authority_json, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(newId('dec'), r.workspace_id, r.venture_id, r.id, r.request_type, r.title, outcome, summary,
    JSON.stringify({ required_approvals: r.required_approvals, eligible_roles: JSON.parse(r.eligible_roles_json), votes }), nowIso())
}

async function executeEffects(env: Env, r: ReqRow): Promise<ReturnType<Env['DB']['prepare']>[]> {
  const ts = nowIso()
  const payload = JSON.parse(r.payload_json || '{}') as Record<string, unknown>
  switch (r.request_type) {
    case 'charter_approval':
      return [
        env.DB.prepare(`UPDATE venture_charters SET status = 'superseded', updated_at = ? WHERE venture_id = ? AND status = 'approved'`).bind(ts, r.venture_id),
        env.DB.prepare(`UPDATE venture_charters SET status = 'approved', updated_at = ? WHERE id = ?`).bind(ts, r.target_id),
        env.DB.prepare(`UPDATE ventures SET status = 'active', updated_at = ? WHERE id = ? AND status IN ('draft','pending_approval')`).bind(ts, r.venture_id),
      ]
    case 'stage_transition': {
      const v = await env.DB.prepare(`SELECT stage FROM ventures WHERE id = ?`).bind(r.target_id).first<{ stage: string }>()
      const to = String(payload.to_stage)
      const gate = await stageGateFailures(env, r.target_id, to)
      if (gate.length) throw new AppError('CONFLICT', `Stage gate no longer satisfied: ${gate.join('; ')}`)
      return [
        env.DB.prepare(`UPDATE ventures SET stage = ?, status = CASE WHEN ? = 'exit' THEN 'closed' WHEN ? = 'hold' THEN 'paused' WHEN status = 'paused' THEN 'active' ELSE status END, updated_at = ? WHERE id = ?`).bind(to, to, to, ts, r.target_id),
        env.DB.prepare(`INSERT INTO venture_stage_history (id, venture_id, from_stage, to_stage, approval_request_id, changed_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(newId('vsh'), r.target_id, v!.stage, to, r.id, ts),
      ]
    }
    case 'budget_approval':
      return [
        env.DB.prepare(`UPDATE budgets SET status = 'superseded' WHERE venture_id = ? AND status = 'approved'`).bind(r.venture_id),
        env.DB.prepare(`UPDATE budgets SET status = 'approved', approval_request_id = ? WHERE id = ?`).bind(r.id, r.target_id),
      ]
    case 'contribution_acceptance':
      return [env.DB.prepare(`UPDATE contributions SET status = 'accepted', accepted_at = ?, approval_request_id = ?, updated_at = ? WHERE id = ?`).bind(ts, r.id, ts, r.target_id)]
    case 'agreement_execution': {
      const unsigned = await env.DB.prepare(`SELECT COUNT(*) AS n FROM agreement_parties WHERE agreement_id = ? AND signature_status NOT IN ('signed','not_required')`).bind(r.target_id).first<{ n: number }>()
      if ((unsigned?.n ?? 0) > 0) throw new AppError('CONFLICT', 'All parties must have signed before execution.')
      return [env.DB.prepare(`UPDATE agreements SET status = 'executed', effective_at = COALESCE(effective_at, ?), approval_request_id = ?, updated_at = ? WHERE id = ?`).bind(ts, r.id, ts, r.target_id)]
    }
    case 'ownership_effective': {
      const oi = await env.DB.prepare(`SELECT venture_id, percentage_basis_points, agreement_id FROM ownership_interests WHERE id = ?`).bind(r.target_id).first<{ venture_id: string; percentage_basis_points: number | null; agreement_id: string }>()
      const ag = await env.DB.prepare(`SELECT status FROM agreements WHERE id = ?`).bind(oi!.agreement_id).first<{ status: string }>()
      if (ag?.status !== 'executed') throw new AppError('CONFLICT', 'The supporting agreement is not executed.')
      const total = await env.DB.prepare(`SELECT COALESCE(SUM(percentage_basis_points),0) AS bps FROM ownership_interests WHERE venture_id = ? AND status = 'effective'`).bind(oi!.venture_id).first<{ bps: number }>()
      if ((total?.bps ?? 0) + (oi!.percentage_basis_points ?? 0) > 10000) throw new AppError('CONFLICT', 'Effective ownership would exceed 100%.')
      return [env.DB.prepare(`UPDATE ownership_interests SET status = 'effective', effective_at = ?, approval_request_id = ?, updated_at = ? WHERE id = ?`).bind(ts, r.id, ts, r.target_id)]
    }
    case 'asset_disposal':
      return [
        env.DB.prepare(`INSERT INTO asset_events (id, asset_id, event_type, detail, actor_person_id, created_at) VALUES (?, ?, 'disposed', ?, NULL, ?)`).bind(newId('ase'), r.target_id, `Disposal approved (${r.id})`, ts),
        env.DB.prepare(`UPDATE assets SET status = 'disposed', approval_request_id = ?, updated_at = ? WHERE id = ?`).bind(r.id, ts, r.target_id),
      ]
  }
}

// ---- Lifecycle stage gates ------------------------------------------------------
export const STAGE_TRANSITIONS: Record<string, string[]> = {
  discover: ['validate', 'hold', 'exit'],
  validate: ['build', 'discover', 'hold', 'exit'],
  build: ['launch', 'validate', 'hold', 'restructure', 'exit'],
  launch: ['operate', 'build', 'hold', 'restructure', 'exit'],
  operate: ['scale', 'hold', 'restructure', 'exit'],
  scale: ['operate', 'hold', 'restructure', 'exit'],
  hold: ['discover', 'validate', 'build', 'launch', 'operate', 'exit'],
  restructure: ['build', 'operate', 'hold', 'exit'],
  exit: [],
}

/** Evidence/approval prerequisites for entering a stage (EBAV-aligned). Returns failed checks. */
export async function stageGateFailures(env: Env, ventureId: string, to: string): Promise<string[]> {
  const fails: string[] = []
  if (['build', 'launch', 'operate', 'scale'].includes(to)) {
    const charter = await env.DB.prepare(`SELECT 1 AS ok FROM venture_charters WHERE venture_id = ? AND status = 'approved'`).bind(ventureId).first()
    if (!charter) fails.push('approved charter required')
    const budget = await env.DB.prepare(`SELECT 1 AS ok FROM budgets WHERE venture_id = ? AND status = 'approved'`).bind(ventureId).first()
    if (!budget) fails.push('approved budget required')
  }
  if (['launch', 'operate', 'scale'].includes(to)) {
    const ev = await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM research_artifacts ra JOIN tasks t ON t.id = ra.task_id WHERE ra.venture_id = ?1 AND ra.status = 'accepted' AND t.execution_mode = 'live')
            + (SELECT COUNT(*) FROM experiments WHERE venture_id = ?1 AND status = 'concluded') AS n`,
    ).bind(ventureId).first<{ n: number }>()
    if ((ev?.n ?? 0) === 0) fails.push('reviewable evidence required (accepted live research brief or concluded experiment; synthetic output is not evidence)')
    const crit = await env.DB.prepare(`SELECT COUNT(*) AS n FROM venture_risks WHERE venture_id = ? AND severity = 'critical' AND status = 'open'`).bind(ventureId).first<{ n: number }>()
    if ((crit?.n ?? 0) > 0) fails.push('open critical risk must be resolved')
  }
  return fails
}
