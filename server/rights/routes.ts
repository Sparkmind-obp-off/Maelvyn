import type { Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import type { AppEnv } from '../env'
import { createApprovalRequest } from '../governance/engine'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { notifyStatements } from '../lib/notify'
import { parseJson, principalOf } from '../lib/request'
import { DATE, isActiveWorkspaceMember, recordCtx, ventureCtx } from '../lib/scope'

/**
 * Rights registers. Contribution ≠ ownership: recording a contribution never creates an ownership interest.
 * Ownership becomes effective only via an executed agreement + multi-party approval (engine: ownership_effective).
 * MAELVYN stores agreement metadata only and never creates signatures: each party records its own signature.
 */
export function registerRightsRoutes(app: Hono<AppEnv>) {
  // ---- Contributions ------------------------------------------------------------------
  app.get('/ventures/:vid/contributions', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const rows = (await c.env.DB.prepare(
      `SELECT x.*, p.display_name AS contributor FROM contributions x JOIN people p ON p.id = x.contributor_person_id WHERE x.venture_id = ? ORDER BY x.created_at DESC`,
    ).bind(access.ventureId).all()).results
    return ok(c, { contributions: rows })
  })

  app.post('/ventures/:vid/contributions', async (c) => {
    const { p, access } = await ventureCtx(c, 'rights.record')
    const body = await parseJson(c, z.object({
      contributor_person_id: z.string().optional(),
      contribution_type: z.enum(['cash', 'labor', 'skill', 'technology', 'ip', 'network', 'equipment', 'inventory', 'loan', 'service', 'other']),
      legal_character: z.enum(['capital', 'loan', 'service_fee', 'reimbursement', 'license', 'sale', 'in_kind_use', 'gift', 'other']),
      description: z.string().trim().min(5).max(1000),
      currency: z.string().regex(/^[A-Z]{3}$/).optional(),
      agreed_value_minor: z.number().int().min(0).optional(),
      valuation_method: z.string().trim().max(300).optional(),
    }).strict())
    const contributor = body.contributor_person_id ?? p.personId
    if (!(await isActiveWorkspaceMember(c.env, access.workspaceId, contributor))) throw new AppError('VALIDATION_ERROR', 'Contributor must be an active workspace member.')
    if (body.agreed_value_minor !== undefined && (!body.currency || !body.valuation_method)) throw new AppError('VALIDATION_ERROR', 'A value requires a currency and a documented valuation method (no fabricated valuations).')
    const id = newId('ctb')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO contributions (id, workspace_id, venture_id, contributor_person_id, contribution_type, legal_character, description, currency, agreed_value_minor, valuation_method, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, contributor, body.contribution_type, body.legal_character, body.description, body.currency ?? null, body.agreed_value_minor ?? null, body.valuation_method ?? null, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'contribution.proposed', targetType: 'contribution', targetId: id, requestId: c.get('requestId'), metadata: { type: body.contribution_type, legal_character: body.legal_character } }),
    ])
    return ok(c, { contribution: { id, status: 'proposed', note: 'A contribution record does not create ownership.' } }, 201)
  })

  app.post('/contributions/:id/submit', async (c) => {
    const { p, access, id } = await recordCtx(c, 'contributions', 'governance.request', 'Contribution')
    const body = await parseJson(c, z.object({ rationale: z.string().trim().min(3).max(1000) }))
    const x = await c.env.DB.prepare(`SELECT status, contributor_person_id, description FROM contributions WHERE id = ?`).bind(id).first<{ status: string; contributor_person_id: string; description: string }>()
    if (x?.status !== 'proposed') throw new AppError('CONFLICT', 'Only proposed contributions can be submitted.')
    const r = await createApprovalRequest(c.env, { principal: p, workspaceId: access.workspaceId, ventureId: access.ventureId, type: 'contribution_acceptance', targetId: id, title: `Accept contribution: ${x.description.slice(0, 60)}`, rationale: body.rationale, subjectPersonId: x.contributor_person_id, requestId: c.get('requestId') })
    return ok(c, { approval_request: r }, 201)
  })

  app.post('/contributions/:id/withdraw', async (c) => {
    const p = principalOf(c)
    const { access, id } = await recordCtx(c, 'contributions', 'venture.read', 'Contribution')
    const x = await c.env.DB.prepare(`SELECT status, contributor_person_id FROM contributions WHERE id = ?`).bind(id).first<{ status: string; contributor_person_id: string }>()
    if (x?.contributor_person_id !== p.personId) throw new AppError('FORBIDDEN', 'Only the contributor can withdraw their own contribution.')
    if (x.status !== 'proposed') throw new AppError('CONFLICT', 'Only proposed contributions can be withdrawn.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE contributions SET status = 'withdrawn', updated_at = ? WHERE id = ?`).bind(nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'contribution.withdrawn', targetType: 'contribution', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { status: 'withdrawn' })
  })

  // ---- Agreements --------------------------------------------------------------------
  app.get('/ventures/:vid/agreements', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const ags = (await c.env.DB.prepare(`SELECT id, agreement_type, title, version, status, summary, effective_at, expires_at, approval_request_id, created_at FROM agreements WHERE venture_id = ? ORDER BY created_at DESC`).bind(access.ventureId).all<{ id: string }>()).results
    const parties = ags.length ? (await c.env.DB.prepare(`SELECT ap.agreement_id, ap.person_id, p.display_name, ap.party_role, ap.signature_status, ap.signed_at FROM agreement_parties ap JOIN people p ON p.id = ap.person_id WHERE ap.agreement_id IN (${ags.map(() => '?').join(',')})`).bind(...ags.map((a) => a.id)).all<{ agreement_id: string }>()).results : []
    return ok(c, { agreements: ags.map((a) => ({ ...a, parties: parties.filter((x) => x.agreement_id === a.id) })) })
  })

  app.post('/ventures/:vid/agreements', async (c) => {
    const { p, access } = await ventureCtx(c, 'rights.record')
    const body = await parseJson(c, z.object({
      agreement_type: z.enum(['participation', 'contribution', 'ownership', 'ip_license', 'loan', 'service', 'asset_transfer', 'other']),
      title: z.string().trim().min(3).max(200), version: z.string().trim().min(1).max(20), summary: z.string().trim().min(3).max(2000),
      effective_at: z.string().regex(DATE).optional(), expires_at: z.string().regex(DATE).optional(),
      parties: z.array(z.object({ person_id: z.string(), party_role: z.string().trim().min(2).max(60) })).min(1).max(20),
    }).strict())
    for (const pt of body.parties) if (!(await isActiveWorkspaceMember(c.env, access.workspaceId, pt.person_id))) throw new AppError('VALIDATION_ERROR', 'All parties must be active workspace members.')
    const id = newId('agr')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO agreements (id, workspace_id, venture_id, agreement_type, title, version, status, effective_at, expires_at, created_by_person_id, created_at, updated_at, summary) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.agreement_type, body.title, body.version, body.effective_at ?? null, body.expires_at ?? null, p.personId, ts, ts, body.summary),
      ...body.parties.map((pt) => c.env.DB.prepare(`INSERT INTO agreement_parties (id, agreement_id, person_id, party_role, signature_status) VALUES (?, ?, ?, ?, 'pending')`).bind(newId('agp'), id, pt.person_id, pt.party_role)),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'agreement.drafted', targetType: 'agreement', targetId: id, requestId: c.get('requestId'), metadata: { type: body.agreement_type, parties: body.parties.length } }),
      ...notifyStatements(c.env, body.parties.map((x) => x.person_id), { workspaceId: access.workspaceId, kind: 'agreement', title: `You are a party to draft agreement: ${body.title}`, link: `/w/${access.workspaceId}/v/${access.ventureId}/rights` }),
    ])
    return ok(c, { agreement: { id, status: 'draft' } }, 201)
  })

  /** A party records their OWN signature decision for the current draft. MAELVYN never signs for anyone. */
  app.post('/agreements/:id/sign', async (c) => {
    const p = principalOf(c)
    const { access, id } = await recordCtx(c, 'agreements', 'venture.read', 'Agreement')
    const body = await parseJson(c, z.object({ decision: z.enum(['signed', 'declined']), confirmation: z.literal('I have read this agreement and record my own decision') }))
    const a = await c.env.DB.prepare(`SELECT status FROM agreements WHERE id = ?`).bind(id).first<{ status: string }>()
    if (!['draft', 'under_review'].includes(a!.status)) throw new AppError('CONFLICT', `Agreement is ${a!.status}.`)
    const party = await c.env.DB.prepare(`SELECT id, signature_status FROM agreement_parties WHERE agreement_id = ? AND person_id = ?`).bind(id, p.personId).first<{ id: string; signature_status: string }>()
    if (!party) throw new AppError('FORBIDDEN', 'You are not a party to this agreement.')
    if (party.signature_status !== 'pending') throw new AppError('CONFLICT', 'Your decision is already recorded.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE agreement_parties SET signature_status = ?, signed_at = ? WHERE id = ?`).bind(body.decision, nowIso(), party.id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: `agreement.party_${body.decision}`, targetType: 'agreement', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { signature_status: body.decision })
  })

  app.post('/agreements/:id/submit', async (c) => {
    const { p, access, id } = await recordCtx(c, 'agreements', 'governance.request', 'Agreement')
    const body = await parseJson(c, z.object({ rationale: z.string().trim().min(3).max(1000) }))
    const a = await c.env.DB.prepare(`SELECT title, status FROM agreements WHERE id = ?`).bind(id).first<{ title: string; status: string }>()
    if (a?.status !== 'draft') throw new AppError('CONFLICT', 'Only draft agreements can be submitted.')
    const pend = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM agreement_parties WHERE agreement_id = ? AND signature_status NOT IN ('signed','not_required')`).bind(id).first<{ n: number }>()
    if ((pend?.n ?? 0) > 0) throw new AppError('CONFLICT', 'All parties must record their signature before execution can be requested.')
    const r = await createApprovalRequest(c.env, { principal: p, workspaceId: access.workspaceId, ventureId: access.ventureId, type: 'agreement_execution', targetId: id, title: `Execute agreement: ${a.title}`, rationale: body.rationale, requestId: c.get('requestId') })
    return ok(c, { approval_request: r }, 201)
  })

  // ---- Ownership register -------------------------------------------------------------
  app.get('/ventures/:vid/ownership', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const rows = (await c.env.DB.prepare(
      `SELECT o.id, o.holder_person_id, p.display_name AS holder, o.agreement_id, a.title AS agreement_title, a.status AS agreement_status, o.interest_type, o.quantity, o.percentage_basis_points, o.status, o.effective_at, o.notes, o.created_at
       FROM ownership_interests o JOIN people p ON p.id = o.holder_person_id JOIN agreements a ON a.id = o.agreement_id WHERE o.venture_id = ? ORDER BY o.created_at`,
    ).bind(access.ventureId).all<{ status: string; percentage_basis_points: number | null }>()).results
    const effective = rows.filter((r) => r.status === 'effective').reduce((s, r) => s + (r.percentage_basis_points ?? 0), 0)
    return ok(c, { interests: rows, effective_basis_points: effective, note: 'No default split exists. Only effective interests backed by executed agreements and approval are shown as effective.' })
  })

  app.post('/ventures/:vid/ownership', async (c) => {
    const { p, access } = await ventureCtx(c, 'rights.record')
    const body = await parseJson(c, z.object({
      holder_person_id: z.string(), agreement_id: z.string(), interest_type: z.enum(['equity', 'unit', 'revenue_share', 'profit_share', 'other']),
      quantity: z.string().trim().max(60).optional(), percentage_basis_points: z.number().int().min(1).max(10000).optional(), notes: z.string().trim().max(1000).optional(),
    }).strict())
    if (!body.quantity && !body.percentage_basis_points) throw new AppError('VALIDATION_ERROR', 'Specify a quantity or percentage from the executed agreement.')
    const a = await c.env.DB.prepare(`SELECT status FROM agreements WHERE id = ? AND venture_id = ?`).bind(body.agreement_id, access.ventureId).first<{ status: string }>()
    if (!a) throw new AppError('VALIDATION_ERROR', 'Agreement not found in this venture.')
    if (!(await isActiveWorkspaceMember(c.env, access.workspaceId, body.holder_person_id))) throw new AppError('VALIDATION_ERROR', 'Holder must be an active workspace member.')
    const id = newId('own')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO ownership_interests (id, workspace_id, venture_id, holder_person_id, agreement_id, interest_type, quantity, percentage_basis_points, status, created_at, updated_at, created_by_person_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.holder_person_id, body.agreement_id, body.interest_type, body.quantity ?? null, body.percentage_basis_points ?? null, ts, ts, p.personId, body.notes ?? null),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'ownership.proposed', targetType: 'ownership_interest', targetId: id, requestId: c.get('requestId'), metadata: { interest_type: body.interest_type, bps: body.percentage_basis_points ?? null } }),
    ])
    return ok(c, { interest: { id, status: 'proposed' } }, 201)
  })

  app.post('/ownership/:id/submit', async (c) => {
    const { p, access, id } = await recordCtx(c, 'ownership_interests', 'governance.request', 'Ownership interest')
    const body = await parseJson(c, z.object({ rationale: z.string().trim().min(3).max(1000), required_approvals: z.number().int().min(2).max(5).optional() }))
    const o = await c.env.DB.prepare(`SELECT o.status, o.holder_person_id, a.status AS ag FROM ownership_interests o JOIN agreements a ON a.id = o.agreement_id WHERE o.id = ?`).bind(id).first<{ status: string; holder_person_id: string; ag: string }>()
    if (o?.status !== 'proposed') throw new AppError('CONFLICT', 'Only proposed interests can be submitted.')
    if (o.ag !== 'executed') throw new AppError('CONFLICT', 'The supporting agreement must be executed first.')
    const r = await createApprovalRequest(c.env, { principal: p, workspaceId: access.workspaceId, ventureId: access.ventureId, type: 'ownership_effective', targetId: id, title: 'Make ownership interest effective', rationale: body.rationale, subjectPersonId: o.holder_person_id, requiredApprovals: body.required_approvals, requestId: c.get('requestId') })
    return ok(c, { approval_request: r }, 201)
  })

  // ---- IP register --------------------------------------------------------------------
  app.get('/ventures/:vid/ip', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    return ok(c, { ip_assets: (await c.env.DB.prepare(`SELECT * FROM ip_assets WHERE venture_id = ? ORDER BY created_at DESC`).bind(access.ventureId).all()).results })
  })

  app.post('/ventures/:vid/ip', async (c) => {
    const { p, access } = await ventureCtx(c, 'rights.record')
    const body = await parseJson(c, z.object({
      title: z.string().trim().min(2).max(200), ip_type: z.enum(['code', 'brand', 'content', 'design', 'data', 'invention', 'other']),
      provenance: z.enum(['created_in_venture', 'contributed', 'licensed_in', 'pre_existing_excluded']), owner_description: z.string().trim().min(2).max(300),
      agreement_id: z.string().optional(), license_terms: z.string().trim().max(1000).optional(), restrictions: z.string().trim().max(1000).optional(),
    }).strict())
    if (['contributed', 'licensed_in'].includes(body.provenance) && !body.agreement_id) throw new AppError('VALIDATION_ERROR', 'Contributed or licensed IP must reference an agreement.')
    if (body.agreement_id && !(await c.env.DB.prepare(`SELECT 1 AS ok FROM agreements WHERE id = ? AND venture_id = ?`).bind(body.agreement_id, access.ventureId).first())) throw new AppError('VALIDATION_ERROR', 'Agreement not found in this venture.')
    const id = newId('ipa')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO ip_assets (id, workspace_id, venture_id, title, ip_type, provenance, owner_description, agreement_id, license_terms, restrictions, status, created_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recorded', ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.title, body.ip_type, body.provenance, body.owner_description, body.agreement_id ?? null, body.license_terms ?? null, body.restrictions ?? null, p.personId, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'ip.recorded', targetType: 'ip_asset', targetId: id, requestId: c.get('requestId'), metadata: { provenance: body.provenance } }),
    ])
    return ok(c, { ip_asset: { id } }, 201)
  })
}
