import type { Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import type { AppEnv, Env } from '../env'
import { createApprovalRequest } from '../governance/engine'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { notifyStatements } from '../lib/notify'
import { parseJson } from '../lib/request'
import { DATE, isActiveVentureMember, isActiveWorkspaceMember, recordCtx, ventureCtx } from '../lib/scope'

const CUR = z.string().regex(/^[A-Z]{3}$/)
const Minor = z.number().int().min(0).max(1e15)

/** Unit economics derived ONLY from recorded orders/offers (source-backed); never estimated. */
export async function unitEconomics(env: Env, ventureId: string) {
  const rows = (await env.DB.prepare(
    `SELECT o.currency, COUNT(*) AS orders, COUNT(DISTINCT o.customer_id) AS customers,
            SUM(o.quantity * o.unit_price_minor) AS revenue_minor, SUM(o.quantity * f.unit_cost_minor) AS direct_cost_minor,
            SUM(CASE WHEN o.payment_status = 'paid' THEN o.quantity * o.unit_price_minor ELSE 0 END) AS paid_minor
     FROM orders o JOIN offers f ON f.id = o.offer_id
     WHERE o.venture_id = ? AND o.status IN ('confirmed','fulfilled') GROUP BY o.currency`,
  ).bind(ventureId).all<{ currency: string; orders: number; customers: number; revenue_minor: number; direct_cost_minor: number; paid_minor: number }>()).results
  return rows.map((r) => {
    const gross = r.revenue_minor - r.direct_cost_minor
    return {
      ...r, gross_margin_minor: gross,
      gross_margin_pct: r.revenue_minor > 0 ? Math.round((gross / r.revenue_minor) * 1000) / 10 : null,
      avg_order_value_minor: r.orders > 0 ? Math.round(r.revenue_minor / r.orders) : null,
      basis: 'recorded confirmed/fulfilled orders; acquisition cost not tracked',
    }
  })
}

export function registerOperationsRoutes(app: Hono<AppEnv>) {
  // ---- Milestones & work items ------------------------------------------------------
  app.get('/ventures/:vid/milestones', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const ms = (await c.env.DB.prepare(`SELECT m.*, p.display_name AS owner FROM milestones m LEFT JOIN people p ON p.id = m.owner_person_id WHERE m.venture_id = ? ORDER BY COALESCE(m.due_date,'9999'), m.created_at`).bind(access.ventureId).all()).results
    const items = (await c.env.DB.prepare(`SELECT w.*, p.display_name AS assignee FROM work_items w LEFT JOIN people p ON p.id = w.assignee_person_id WHERE w.venture_id = ? ORDER BY w.status, COALESCE(w.due_date,'9999')`).bind(access.ventureId).all()).results
    return ok(c, { milestones: ms, work_items: items })
  })

  app.post('/ventures/:vid/milestones', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({ title: z.string().trim().min(2).max(200), description: z.string().trim().max(2000).optional(), due_date: z.string().regex(DATE).optional(), owner_person_id: z.string().optional() }).strict())
    if (body.owner_person_id && !(await isActiveVentureMember(c.env, access.ventureId, body.owner_person_id))) throw new AppError('VALIDATION_ERROR', 'Owner must have an active assignment in this venture.')
    const id = newId('mil')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO milestones (id, workspace_id, venture_id, title, description, due_date, owner_person_id, status, created_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.title, body.description ?? null, body.due_date ?? null, body.owner_person_id ?? null, p.personId, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'milestone.created', targetType: 'milestone', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { milestone: { id } }, 201)
  })

  app.patch('/milestones/:id', async (c) => {
    const { p, access, id } = await recordCtx(c, 'milestones', 'venture.manage', 'Milestone')
    const body = await parseJson(c, z.object({ status: z.enum(['planned', 'in_progress', 'done', 'blocked', 'cancelled']) }))
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE milestones SET status = ?, updated_at = ? WHERE id = ?`).bind(body.status, nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'milestone.status_changed', targetType: 'milestone', targetId: id, requestId: c.get('requestId'), metadata: body }),
    ])
    return ok(c, body)
  })

  app.post('/ventures/:vid/work-items', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({
      title: z.string().trim().min(2).max(200), description: z.string().trim().max(2000).optional(), milestone_id: z.string().optional(),
      depends_on_id: z.string().optional(), assignee_person_id: z.string().optional(), due_date: z.string().regex(DATE).optional(),
    }).strict())
    if (body.assignee_person_id && !(await isActiveVentureMember(c.env, access.ventureId, body.assignee_person_id))) throw new AppError('VALIDATION_ERROR', 'Assignee must have an active assignment in this venture.')
    for (const [col, table] of [[body.milestone_id, 'milestones'], [body.depends_on_id, 'work_items']] as const) {
      if (col && !(await c.env.DB.prepare(`SELECT 1 AS ok FROM ${table} WHERE id = ? AND venture_id = ?`).bind(col, access.ventureId).first())) throw new AppError('VALIDATION_ERROR', 'Referenced record is not in this venture.')
    }
    const id = newId('wit')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO work_items (id, workspace_id, venture_id, milestone_id, depends_on_id, title, description, assignee_person_id, due_date, status, created_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.milestone_id ?? null, body.depends_on_id ?? null, body.title, body.description ?? null, body.assignee_person_id ?? null, body.due_date ?? null, p.personId, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'work_item.created', targetType: 'work_item', targetId: id, requestId: c.get('requestId') }),
      ...(body.assignee_person_id && body.assignee_person_id !== p.personId ? notifyStatements(c.env, [body.assignee_person_id], { workspaceId: access.workspaceId, kind: 'task', title: `Assigned: ${body.title}`, link: `/w/${access.workspaceId}/v/${access.ventureId}/ops` }) : []),
    ])
    return ok(c, { work_item: { id } }, 201)
  })

  app.patch('/work-items/:id', async (c) => {
    const { p, access, id } = await recordCtx(c, 'work_items', 'venture.manage', 'Work item')
    const body = await parseJson(c, z.object({ status: z.enum(['todo', 'doing', 'blocked', 'done', 'cancelled']), blocked_reason: z.string().trim().max(300).optional() }))
    if (body.status === 'blocked' && !body.blocked_reason) throw new AppError('VALIDATION_ERROR', 'A blocked item needs a reason.')
    if (body.status === 'done') {
      const dep = await c.env.DB.prepare(`SELECT d.status FROM work_items w JOIN work_items d ON d.id = w.depends_on_id WHERE w.id = ?`).bind(id).first<{ status: string }>()
      if (dep && dep.status !== 'done') throw new AppError('CONFLICT', 'The dependency must be done first.')
    }
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE work_items SET status = ?, blocked_reason = ?, updated_at = ? WHERE id = ?`).bind(body.status, body.status === 'blocked' ? body.blocked_reason! : null, nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'work_item.status_changed', targetType: 'work_item', targetId: id, requestId: c.get('requestId'), metadata: body }),
    ])
    return ok(c, body)
  })

  // ---- Assets -----------------------------------------------------------------------
  app.get('/ventures/:vid/assets', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const assets = (await c.env.DB.prepare(`SELECT a.*, p.display_name AS custodian FROM assets a LEFT JOIN people p ON p.id = a.custodian_person_id WHERE a.venture_id = ? ORDER BY a.created_at DESC`).bind(access.ventureId).all<{ id: string }>()).results
    const events = assets.length ? (await c.env.DB.prepare(`SELECT e.asset_id, e.event_type, e.detail, e.created_at, p.display_name AS actor FROM asset_events e LEFT JOIN people p ON p.id = e.actor_person_id WHERE e.asset_id IN (${assets.map(() => '?').join(',')}) ORDER BY e.created_at DESC`).bind(...assets.map((a) => a.id)).all<{ asset_id: string }>()).results : []
    return ok(c, { assets: assets.map((a) => ({ ...a, events: events.filter((e) => e.asset_id === a.id) })) })
  })

  app.post('/ventures/:vid/assets', async (c) => {
    const { p, access } = await ventureCtx(c, 'rights.record')
    const body = await parseJson(c, z.object({
      asset_name: z.string().trim().min(2).max(200), asset_type: z.string().trim().min(2).max(60),
      ownership_basis: z.enum(['personal_not_contributed', 'owned_by_venture', 'leased', 'licensed', 'shared_use', 'under_review']),
      legal_owner_description: z.string().trim().min(2).max(300), agreement_id: z.string().optional(), custodian_person_id: z.string().optional(),
      location: z.string().trim().max(200).optional(), condition: z.string().trim().max(200).optional(), acquisition_value_minor: Minor.optional(), currency: CUR.optional(),
    }).strict())
    if (['leased', 'licensed', 'shared_use'].includes(body.ownership_basis) && !body.agreement_id) throw new AppError('VALIDATION_ERROR', 'Leased, licensed or shared-use assets must reference an agreement.')
    if (body.agreement_id && !(await c.env.DB.prepare(`SELECT 1 AS ok FROM agreements WHERE id = ? AND venture_id = ?`).bind(body.agreement_id, access.ventureId).first())) throw new AppError('VALIDATION_ERROR', 'Agreement not found in this venture.')
    if (body.custodian_person_id && !(await isActiveWorkspaceMember(c.env, access.workspaceId, body.custodian_person_id))) throw new AppError('VALIDATION_ERROR', 'Custodian must be an active workspace member.')
    if (body.acquisition_value_minor !== undefined && !body.currency) throw new AppError('VALIDATION_ERROR', 'A value requires a currency.')
    const id = newId('ast')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO assets (id, workspace_id, venture_id, asset_name, asset_type, ownership_basis, legal_owner_description, agreement_id, acquisition_value_minor, currency, status, created_at, updated_at, custodian_person_id, location, condition, created_by_person_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.asset_name, body.asset_type, body.ownership_basis, body.legal_owner_description, body.agreement_id ?? null, body.acquisition_value_minor ?? null, body.currency ?? null, ts, ts, body.custodian_person_id ?? null, body.location ?? null, body.condition ?? null, p.personId),
      c.env.DB.prepare(`INSERT INTO asset_events (id, asset_id, event_type, detail, actor_person_id, created_at) VALUES (?, ?, 'registered', ?, ?, ?)`).bind(newId('ase'), id, `Registered (${body.ownership_basis})`, p.personId, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'asset.registered', targetType: 'asset', targetId: id, requestId: c.get('requestId'), metadata: { ownership_basis: body.ownership_basis } }),
    ])
    return ok(c, { asset: { id } }, 201)
  })

  app.post('/assets/:id/events', async (c) => {
    const { p, access, id } = await recordCtx(c, 'assets', 'rights.record', 'Asset')
    const body = await parseJson(c, z.object({
      event_type: z.enum(['custody_change', 'location_change', 'condition_report', 'maintenance']), detail: z.string().trim().min(2).max(500),
      custodian_person_id: z.string().optional(), location: z.string().trim().max(200).optional(), condition: z.string().trim().max(200).optional(),
    }).strict())
    const a = await c.env.DB.prepare(`SELECT status FROM assets WHERE id = ?`).bind(id).first<{ status: string }>()
    if (a?.status === 'disposed') throw new AppError('CONFLICT', 'Disposed assets cannot change.')
    if (body.custodian_person_id && !(await isActiveWorkspaceMember(c.env, access.workspaceId, body.custodian_person_id))) throw new AppError('VALIDATION_ERROR', 'Custodian must be an active workspace member.')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO asset_events (id, asset_id, event_type, detail, actor_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(newId('ase'), id, body.event_type, body.detail, p.personId, ts),
      c.env.DB.prepare(`UPDATE assets SET custodian_person_id = COALESCE(?, custodian_person_id), location = COALESCE(?, location), condition = COALESCE(?, condition), status = CASE WHEN ? = 'maintenance' THEN 'maintenance' ELSE 'active' END, updated_at = ? WHERE id = ?`)
        .bind(body.custodian_person_id ?? null, body.location ?? null, body.condition ?? null, body.event_type, ts, id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: `asset.${body.event_type}`, targetType: 'asset', targetId: id, requestId: c.get('requestId'), reason: body.detail }),
    ])
    return ok(c, { recorded: true }, 201)
  })

  app.post('/assets/:id/dispose', async (c) => {
    const { p, access, id } = await recordCtx(c, 'assets', 'governance.request', 'Asset')
    const body = await parseJson(c, z.object({ rationale: z.string().trim().min(3).max(1000) }))
    const a = await c.env.DB.prepare(`SELECT asset_name, status FROM assets WHERE id = ?`).bind(id).first<{ asset_name: string; status: string }>()
    if (a?.status === 'disposed') throw new AppError('CONFLICT', 'Asset already disposed.')
    const r = await createApprovalRequest(c.env, { principal: p, workspaceId: access.workspaceId, ventureId: access.ventureId, type: 'asset_disposal', targetId: id, title: `Dispose asset: ${a!.asset_name}`, rationale: body.rationale, requestId: c.get('requestId') })
    return ok(c, { approval_request: r }, 201)
  })

  // ---- Revenue: customers, offers, orders ---------------------------------------------
  app.get('/ventures/:vid/revenue', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const [customers, offers, orders] = await Promise.all([
      c.env.DB.prepare(`SELECT id, name, segment, notes, created_at FROM customers WHERE venture_id = ? ORDER BY created_at DESC`).bind(access.ventureId).all(),
      c.env.DB.prepare(`SELECT id, name, currency, price_minor, unit_cost_minor, status, created_at FROM offers WHERE venture_id = ? ORDER BY created_at DESC`).bind(access.ventureId).all(),
      c.env.DB.prepare(`SELECT o.*, cu.name AS customer_name, f.name AS offer_name FROM orders o JOIN customers cu ON cu.id = o.customer_id JOIN offers f ON f.id = o.offer_id WHERE o.venture_id = ? ORDER BY o.order_date DESC LIMIT 200`).bind(access.ventureId).all(),
    ])
    return ok(c, { customers: customers.results, offers: offers.results, orders: orders.results, unit_economics: await unitEconomics(c.env, access.ventureId) })
  })

  app.post('/ventures/:vid/customers', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({ name: z.string().trim().min(2).max(120), segment: z.string().trim().max(120).optional(), notes: z.string().trim().max(1000).optional() }).strict())
    const id = newId('cus')
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO customers (id, workspace_id, venture_id, name, segment, notes, created_by_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, access.workspaceId, access.ventureId, body.name, body.segment ?? null, body.notes ?? null, p.personId, nowIso()),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'customer.created', targetType: 'customer', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { customer: { id } }, 201)
  })

  app.post('/ventures/:vid/offers', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({ name: z.string().trim().min(2).max(120), currency: CUR, price_minor: Minor, unit_cost_minor: Minor.default(0) }).strict())
    const id = newId('ofr')
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO offers (id, workspace_id, venture_id, name, currency, price_minor, unit_cost_minor, status, created_by_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`).bind(id, access.workspaceId, access.ventureId, body.name, body.currency, body.price_minor, body.unit_cost_minor, p.personId, nowIso()),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'offer.created', targetType: 'offer', targetId: id, requestId: c.get('requestId'), metadata: body }),
    ])
    return ok(c, { offer: { id } }, 201)
  })

  app.post('/ventures/:vid/orders', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({
      customer_id: z.string(), offer_id: z.string(), quantity: z.number().int().min(1).max(1e6), order_date: z.string().regex(DATE),
      status: z.enum(['quoted', 'confirmed', 'fulfilled']).default('confirmed'), evidence_note: z.string().trim().min(3).max(500),
    }).strict())
    const cu = await c.env.DB.prepare(`SELECT 1 AS ok FROM customers WHERE id = ? AND venture_id = ?`).bind(body.customer_id, access.ventureId).first()
    const of = await c.env.DB.prepare(`SELECT currency, price_minor, status FROM offers WHERE id = ? AND venture_id = ?`).bind(body.offer_id, access.ventureId).first<{ currency: string; price_minor: number; status: string }>()
    if (!cu || !of) throw new AppError('VALIDATION_ERROR', 'Customer and offer must belong to this venture.')
    if (of.status !== 'active') throw new AppError('VALIDATION_ERROR', 'Offer is retired.')
    const id = newId('ord')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO orders (id, workspace_id, venture_id, customer_id, offer_id, quantity, unit_price_minor, currency, order_date, status, payment_status, evidence_note, created_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.customer_id, body.offer_id, body.quantity, of.price_minor, of.currency, body.order_date, body.status, body.evidence_note, p.personId, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'order.recorded', targetType: 'order', targetId: id, requestId: c.get('requestId'), metadata: { quantity: body.quantity, unit_price_minor: of.price_minor, currency: of.currency } }),
    ])
    return ok(c, { order: { id, note: 'Order records are evidence metadata. Accounting entries are posted separately in the ledger.' } }, 201)
  })

  app.patch('/orders/:id', async (c) => {
    const { p, access, id } = await recordCtx(c, 'orders', 'venture.manage', 'Order')
    const body = await parseJson(c, z.object({ status: z.enum(['quoted', 'confirmed', 'fulfilled', 'cancelled', 'refunded']).optional(), payment_status: z.enum(['unpaid', 'paid', 'refunded']).optional(), evidence_note: z.string().trim().min(3).max(500) }).strict())
    const cur = await c.env.DB.prepare(`SELECT status FROM orders WHERE id = ?`).bind(id).first<{ status: string }>()
    if (['cancelled', 'refunded'].includes(cur!.status)) throw new AppError('CONFLICT', `Order is ${cur!.status}.`)
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE orders SET status = COALESCE(?, status), payment_status = COALESCE(?, payment_status), evidence_note = ?, updated_at = ? WHERE id = ?`).bind(body.status ?? null, body.payment_status ?? null, body.evidence_note, nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'order.updated', targetType: 'order', targetId: id, requestId: c.get('requestId'), metadata: body }),
    ])
    return ok(c, { updated: true })
  })

  // ---- Validation experiments ------------------------------------------------------------
  app.get('/ventures/:vid/experiments', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    return ok(c, { experiments: (await c.env.DB.prepare(`SELECT e.*, p.display_name AS owner FROM experiments e JOIN people p ON p.id = e.owner_person_id WHERE e.venture_id = ? ORDER BY e.created_at DESC`).bind(access.ventureId).all()).results })
  })

  app.post('/ventures/:vid/experiments', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({
      hypothesis: z.string().trim().min(10).max(1000), method: z.string().trim().min(5).max(1000), metric: z.string().trim().min(2).max(200),
      success_threshold: z.string().trim().min(2).max(300), budget_cap_minor: Minor.default(0), timebox_end: z.string().regex(DATE),
    }).strict())
    const id = newId('exp')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO experiments (id, workspace_id, venture_id, hypothesis, method, metric, success_threshold, budget_cap_minor, timebox_end, owner_person_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.hypothesis, body.method, body.metric, body.success_threshold, body.budget_cap_minor, body.timebox_end, p.personId, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'experiment.planned', targetType: 'experiment', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { experiment: { id } }, 201)
  })

  app.post('/experiments/:id/start', async (c) => {
    const { p, access, id } = await recordCtx(c, 'experiments', 'venture.manage', 'Experiment')
    const e = await c.env.DB.prepare(`SELECT status FROM experiments WHERE id = ?`).bind(id).first<{ status: string }>()
    if (e?.status !== 'planned') throw new AppError('CONFLICT', 'Only planned experiments can start.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE experiments SET status = 'running', updated_at = ? WHERE id = ?`).bind(nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'experiment.started', targetType: 'experiment', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { status: 'running' })
  })

  app.post('/experiments/:id/conclude', async (c) => {
    const { p, access, id } = await recordCtx(c, 'experiments', 'venture.manage', 'Experiment')
    const body = await parseJson(c, z.object({
      result: z.enum(['supported', 'refuted', 'inconclusive']), result_summary: z.string().trim().min(5).max(2000), sample_size: z.number().int().min(0).max(1e9),
      evidence_note: z.string().trim().min(3).max(1000), decision: z.enum(['proceed', 'test', 'revise', 'hold', 'reject']),
    }).strict())
    const e = await c.env.DB.prepare(`SELECT status, hypothesis FROM experiments WHERE id = ?`).bind(id).first<{ status: string; hypothesis: string }>()
    if (e?.status !== 'running') throw new AppError('CONFLICT', 'Only running experiments can be concluded.')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE experiments SET status = 'concluded', result = ?, result_summary = ?, sample_size = ?, evidence_note = ?, decision = ?, concluded_at = ?, updated_at = ? WHERE id = ?`)
        .bind(body.result, body.result_summary, body.sample_size, body.evidence_note, body.decision, ts, ts, id),
      c.env.DB.prepare(`INSERT INTO memory_records (id, workspace_id, venture_id, kind, content, source_type, source_id, confidence, sensitivity, status, created_by_person_id, created_at) VALUES (?, ?, ?, 'insight', ?, 'experiment', ?, 'unverified', 'internal', 'active', ?, ?)`)
        .bind(newId('mem'), access.workspaceId, access.ventureId, `Experiment ${body.result} (n=${body.sample_size}): ${e.hypothesis.slice(0, 200)} — ${body.result_summary.slice(0, 400)}`, id, p.personId, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'experiment.concluded', targetType: 'experiment', targetId: id, requestId: c.get('requestId'), metadata: { result: body.result, decision: body.decision } }),
    ])
    return ok(c, { status: 'concluded' })
  })

  app.post('/experiments/:id/abandon', async (c) => {
    const { p, access, id } = await recordCtx(c, 'experiments', 'venture.manage', 'Experiment')
    const body = await parseJson(c, z.object({ reason: z.string().trim().min(3).max(500) }))
    const e = await c.env.DB.prepare(`SELECT status FROM experiments WHERE id = ?`).bind(id).first<{ status: string }>()
    if (!['planned', 'running'].includes(e!.status)) throw new AppError('CONFLICT', 'Experiment already closed.')
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE experiments SET status = 'abandoned', result_summary = ?, updated_at = ? WHERE id = ?`).bind(`Abandoned: ${body.reason}`, nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'experiment.abandoned', targetType: 'experiment', targetId: id, requestId: c.get('requestId'), reason: body.reason }),
    ])
    return ok(c, { status: 'abandoned' })
  })

  // ---- Risks & reviews ----------------------------------------------------------------------
  app.get('/ventures/:vid/risks', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    return ok(c, { risks: (await c.env.DB.prepare(`SELECT r.*, p.display_name AS owner FROM venture_risks r LEFT JOIN people p ON p.id = r.owner_person_id WHERE r.venture_id = ? ORDER BY r.status, CASE r.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`).bind(access.ventureId).all()).results })
  })

  app.post('/ventures/:vid/risks', async (c) => {
    const { p, access } = await ventureCtx(c, 'venture.manage')
    const body = await parseJson(c, z.object({
      title: z.string().trim().min(3).max(200), category: z.enum(['governance', 'legal', 'financial', 'privacy', 'security', 'operational', 'market']),
      severity: z.enum(['low', 'medium', 'high', 'critical']), mitigation: z.string().trim().max(1000).optional(), owner_person_id: z.string().optional(),
    }).strict())
    if (body.owner_person_id && !(await isActiveVentureMember(c.env, access.ventureId, body.owner_person_id))) throw new AppError('VALIDATION_ERROR', 'Owner must have an active assignment in this venture.')
    const id = newId('rsk')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO venture_risks (id, workspace_id, venture_id, title, category, severity, status, mitigation, owner_person_id, created_by_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.title, body.category, body.severity, body.mitigation ?? null, body.owner_person_id ?? null, p.personId, ts, ts),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'risk.opened', targetType: 'risk', targetId: id, requestId: c.get('requestId'), metadata: { severity: body.severity, category: body.category } }),
    ])
    return ok(c, { risk: { id } }, 201)
  })

  app.patch('/risks/:id', async (c) => {
    const { p, access, id } = await recordCtx(c, 'venture_risks', 'venture.manage', 'Risk')
    const body = await parseJson(c, z.object({ status: z.enum(['open', 'mitigated', 'closed']), mitigation: z.string().trim().min(3).max(1000) }).strict())
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE venture_risks SET status = ?, mitigation = ?, updated_at = ? WHERE id = ?`).bind(body.status, body.mitigation, nowIso(), id),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: `risk.${body.status}`, targetType: 'risk', targetId: id, requestId: c.get('requestId'), reason: body.mitigation }),
    ])
    return ok(c, body)
  })

  app.get('/ventures/:vid/reviews', async (c) => {
    const { access } = await ventureCtx(c, 'venture.read')
    const rows = (await c.env.DB.prepare(`SELECT r.*, p.display_name AS reviewer FROM venture_reviews r JOIN people p ON p.id = r.reviewer_person_id WHERE r.venture_id = ? ORDER BY r.created_at DESC`).bind(access.ventureId).all<Record<string, unknown>>()).results
    return ok(c, { reviews: rows.map((r) => ({ ...r, metrics: JSON.parse(String(r.metrics_json)), metrics_json: undefined })) })
  })

  /** A review snapshots metrics computed from records at review time; the recommendation is human-authored. */
  app.post('/ventures/:vid/reviews', async (c) => {
    const { p, access } = await ventureCtx(c, 'governance.request')
    const body = await parseJson(c, z.object({
      period_label: z.string().trim().min(2).max(60), summary: z.string().trim().min(10).max(3000),
      recommendation: z.enum(['proceed', 'test', 'revise', 'hold', 'reject', 'scale', 'restructure', 'exit']),
    }).strict())
    const v = await c.env.DB.prepare(`SELECT stage, status FROM ventures WHERE id = ?`).bind(access.ventureId).first<{ stage: string; status: string }>()
    const counts = await c.env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM work_items WHERE venture_id = ?1 AND status = 'done') AS work_done,
              (SELECT COUNT(*) FROM work_items WHERE venture_id = ?1 AND status IN ('todo','doing','blocked')) AS work_open,
              (SELECT COUNT(*) FROM venture_risks WHERE venture_id = ?1 AND status = 'open') AS open_risks,
              (SELECT COUNT(*) FROM experiments WHERE venture_id = ?1 AND status = 'concluded') AS experiments_concluded,
              (SELECT COUNT(*) FROM research_artifacts WHERE venture_id = ?1 AND status = 'accepted') AS accepted_briefs`,
    ).bind(access.ventureId).first()
    const metrics = { stage: v!.stage, status: v!.status, ...counts, unit_economics: await unitEconomics(c.env, access.ventureId), snapshot_at: nowIso() }
    const id = newId('rev')
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO venture_reviews (id, workspace_id, venture_id, period_label, summary, recommendation, metrics_json, reviewer_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.period_label, body.summary, body.recommendation, JSON.stringify(metrics), p.personId, nowIso()),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'venture.reviewed', targetType: 'venture', targetId: access.ventureId, requestId: c.get('requestId'), metadata: { recommendation: body.recommendation } }),
    ])
    return ok(c, { review: { id, metrics, note: 'A recommendation is not a decision. Stage changes require a governed stage request.' } }, 201)
  })
}
