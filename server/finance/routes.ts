import type { Hono } from 'hono'
import { z } from 'zod'
import { auditStatement } from '../audit/audit'
import type { AppEnv, Env } from '../env'
import { createApprovalRequest } from '../governance/engine'
import { AppError, newId, nowIso, ok } from '../lib/http'
import { withIdempotency } from '../lib/idempotency'
import { parseJson } from '../lib/request'
import { DATE, recordCtx, ventureCtx } from '../lib/scope'

/**
 * Finance Core — records only. MAELVYN never holds funds, executes payments or distributes surplus.
 * - Balanced double-entry journals; posting is maker-checker (poster ≠ preparer).
 * - Posted entries are immutable (DB triggers); corrections use one linked reversal entry.
 * - Expense postings require an approved budget in the same currency and cannot exceed its cap.
 */
const CUR = z.string().regex(/^[A-Z]{3}$/, 'ISO 4217 code, e.g. IDR')
const Minor = z.number().int().min(0).max(1e15)

type Line = { account_id: string; debit_minor: number; credit_minor: number; description?: string | null }

async function loadAccounts(env: Env, ventureId: string, ids: string[]) {
  if (!ids.length) return new Map<string, { id: string; account_type: string; currency: string; is_active: number }>()
  const rows = (await env.DB.prepare(`SELECT id, account_type, currency, is_active FROM finance_accounts WHERE venture_id = ? AND id IN (${ids.map(() => '?').join(',')})`)
    .bind(ventureId, ...ids).all<{ id: string; account_type: string; currency: string; is_active: number }>()).results
  return new Map(rows.map((r) => [r.id, r]))
}

function validateLines(lines: Line[], accounts: Map<string, { account_type: string; currency: string; is_active: number }>, currency: string) {
  if (lines.length < 2) throw new AppError('LEDGER_NOT_BALANCED', 'A journal entry needs at least two lines.')
  let dr = 0
  let cr = 0
  for (const l of lines) {
    const a = accounts.get(l.account_id)
    if (!a) throw new AppError('VALIDATION_ERROR', 'Every line must use an account of this venture.')
    if (!a.is_active) throw new AppError('VALIDATION_ERROR', 'Inactive accounts cannot be used.')
    if (a.currency !== currency) throw new AppError('VALIDATION_ERROR', 'All lines must use accounts in the entry currency.')
    if ((l.debit_minor > 0) === (l.credit_minor > 0)) throw new AppError('VALIDATION_ERROR', 'Each line must have either a debit or a credit amount.')
    dr += l.debit_minor
    cr += l.credit_minor
  }
  if (dr !== cr) throw new AppError('LEDGER_NOT_BALANCED', `Debits (${dr}) must equal credits (${cr}).`, { debit_minor: dr, credit_minor: cr })
  return dr
}

async function nextEntryNumber(env: Env, ventureId: string) {
  const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM journal_entries WHERE venture_id = ?`).bind(ventureId).first<{ n: number }>()
  return `JE-${String((r?.n ?? 0) + 1).padStart(5, '0')}`
}

export async function budgetStatus(env: Env, ventureId: string) {
  const b = await env.DB.prepare(`SELECT id, version, currency, cap_minor, period_start, period_end FROM budgets WHERE venture_id = ? AND status = 'approved'`).bind(ventureId)
    .first<{ id: string; version: number; currency: string; cap_minor: number; period_start: string | null; period_end: string | null }>()
  if (!b) return null
  const spent = await env.DB.prepare(
    `SELECT COALESCE(SUM(l.debit_minor - l.credit_minor),0) AS spent FROM journal_lines l JOIN journal_entries e ON e.id = l.journal_entry_id JOIN finance_accounts a ON a.id = l.account_id
     WHERE e.venture_id = ? AND e.status = 'posted' AND a.account_type = 'expense' AND e.currency = ?
       AND (? IS NULL OR e.entry_date >= ?) AND (? IS NULL OR e.entry_date <= ?)`,
  ).bind(ventureId, b.currency, b.period_start, b.period_start, b.period_end, b.period_end).first<{ spent: number }>()
  return { ...b, spent_minor: spent?.spent ?? 0, remaining_minor: b.cap_minor - (spent?.spent ?? 0) }
}

export function registerFinanceRoutes(app: Hono<AppEnv>) {
  // ---- Budgets -------------------------------------------------------------------------
  app.get('/ventures/:vid/budgets', async (c) => {
    const { access } = await ventureCtx(c, 'finance.read')
    const budgets = (await c.env.DB.prepare(`SELECT id, version, currency, cap_minor, status, period_start, period_end, notes, approval_request_id, created_at FROM budgets WHERE venture_id = ? ORDER BY version DESC`).bind(access.ventureId).all<{ id: string }>()).results
    const lines = budgets.length ? (await c.env.DB.prepare(`SELECT budget_id, category, description, amount_minor FROM budget_lines WHERE budget_id IN (${budgets.map(() => '?').join(',')}) ORDER BY rowid`).bind(...budgets.map((b) => b.id)).all<{ budget_id: string }>()).results : []
    return ok(c, { budgets: budgets.map((b) => ({ ...b, lines: lines.filter((l) => l.budget_id === b.id) })), current: await budgetStatus(c.env, access.ventureId) })
  })

  app.post('/ventures/:vid/budgets', async (c) => {
    const { p, access } = await ventureCtx(c, 'finance.draft')
    const body = await parseJson(c, z.object({
      currency: CUR, period_start: z.string().regex(DATE), period_end: z.string().regex(DATE), notes: z.string().trim().max(1000).optional(),
      lines: z.array(z.object({ category: z.string().trim().min(2).max(60), description: z.string().trim().min(2).max(300), amount_minor: Minor.min(1) })).min(1).max(50),
    }).strict())
    if (body.period_end < body.period_start) throw new AppError('VALIDATION_ERROR', 'Period end must be after period start.')
    const open = await c.env.DB.prepare(`SELECT 1 AS ok FROM budgets WHERE venture_id = ? AND status IN ('draft','submitted')`).bind(access.ventureId).first()
    if (open) throw new AppError('CONFLICT', 'A draft or submitted budget already exists.')
    const v = await c.env.DB.prepare(`SELECT COALESCE(MAX(version),0)+1 AS v FROM budgets WHERE venture_id = ?`).bind(access.ventureId).first<{ v: number }>()
    const id = newId('bud')
    const ts = nowIso()
    const cap = body.lines.reduce((s, l) => s + l.amount_minor, 0)
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO budgets (id, workspace_id, venture_id, version, currency, cap_minor, status, period_start, period_end, created_by_person_id, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, v!.v, body.currency, cap, body.period_start, body.period_end, p.personId, ts, body.notes ?? null),
      ...body.lines.map((l) => c.env.DB.prepare(`INSERT INTO budget_lines (id, budget_id, category, description, amount_minor, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(newId('bln'), id, l.category, l.description, l.amount_minor, ts)),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'budget.drafted', targetType: 'budget', targetId: id, requestId: c.get('requestId'), metadata: { version: v!.v, cap_minor: cap, currency: body.currency } }),
    ])
    return ok(c, { budget: { id, version: v!.v, cap_minor: cap, status: 'draft' } }, 201)
  })

  app.post('/budgets/:id/submit', async (c) => {
    const { p, access, id } = await recordCtx(c, 'budgets', 'governance.request', 'Budget')
    const body = await parseJson(c, z.object({ rationale: z.string().trim().min(3).max(1000), required_approvals: z.number().int().min(1).max(5).optional() }))
    const b = await c.env.DB.prepare(`SELECT version, status, cap_minor, currency FROM budgets WHERE id = ?`).bind(id).first<{ version: number; status: string; cap_minor: number; currency: string }>()
    if (b?.status !== 'draft') throw new AppError('CONFLICT', 'Only draft budgets can be submitted.')
    const r = await createApprovalRequest(c.env, { principal: p, workspaceId: access.workspaceId, ventureId: access.ventureId, type: 'budget_approval', targetId: id, title: `Budget v${b.version} (${b.currency} ${b.cap_minor / 100})`, rationale: body.rationale, requiredApprovals: body.required_approvals, requestId: c.get('requestId') })
    return ok(c, { approval_request: r }, 201)
  })

  // ---- Chart of accounts ------------------------------------------------------------------
  app.get('/ventures/:vid/finance/accounts', async (c) => {
    const { access } = await ventureCtx(c, 'finance.read')
    const rows = (await c.env.DB.prepare(
      `SELECT a.id, a.code, a.name, a.account_type, a.subtype, a.currency, a.is_active,
        COALESCE((SELECT SUM(l.debit_minor) FROM journal_lines l JOIN journal_entries e ON e.id = l.journal_entry_id WHERE l.account_id = a.id AND e.status = 'posted'),0) AS debit_minor,
        COALESCE((SELECT SUM(l.credit_minor) FROM journal_lines l JOIN journal_entries e ON e.id = l.journal_entry_id WHERE l.account_id = a.id AND e.status = 'posted'),0) AS credit_minor
       FROM finance_accounts a WHERE a.venture_id = ? ORDER BY a.code`,
    ).bind(access.ventureId).all<{ account_type: string; debit_minor: number; credit_minor: number }>()).results
    return ok(c, { accounts: rows.map((r) => ({ ...r, balance_minor: ['asset', 'expense'].includes(r.account_type) ? r.debit_minor - r.credit_minor : r.credit_minor - r.debit_minor })) })
  })

  app.post('/ventures/:vid/finance/accounts', async (c) => {
    const { p, access } = await ventureCtx(c, 'finance.post')
    const body = await parseJson(c, z.object({
      code: z.string().trim().regex(/^[0-9A-Z-]{2,12}$/), name: z.string().trim().min(2).max(100),
      account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']), subtype: z.enum(['cash', 'receivable', 'payable', 'reserve', 'other']).optional(), currency: CUR,
    }).strict())
    const id = newId('fac')
    try {
      await c.env.DB.batch([
        c.env.DB.prepare(`INSERT INTO finance_accounts (id, workspace_id, venture_id, code, name, account_type, currency, is_active, created_at, subtype) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
          .bind(id, access.workspaceId, access.ventureId, body.code, body.name, body.account_type, body.currency, nowIso(), body.subtype ?? null),
        auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'finance.account_created', targetType: 'finance_account', targetId: id, requestId: c.get('requestId'), metadata: body }),
      ])
    } catch (e) {
      if (String(e).includes('UNIQUE')) throw new AppError('CONFLICT', 'Account code already exists in this venture.')
      throw e
    }
    return ok(c, { account: { id, ...body } }, 201)
  })

  app.post('/ventures/:vid/finance/accounts/defaults', async (c) => {
    const { p, access } = await ventureCtx(c, 'finance.post')
    const body = await parseJson(c, z.object({ currency: CUR }))
    const existing = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM finance_accounts WHERE venture_id = ?`).bind(access.ventureId).first<{ n: number }>()
    if ((existing?.n ?? 0) > 0) throw new AppError('CONFLICT', 'This venture already has accounts.')
    const defs: [string, string, string, string | null][] = [
      ['1000', 'Cash and bank (venture)', 'asset', 'cash'], ['1100', 'Receivables', 'asset', 'receivable'], ['2000', 'Payables', 'liability', 'payable'],
      ['2100', 'Loans payable (per executed agreement)', 'liability', 'other'], ['3000', 'Contributed capital (per executed agreement)', 'equity', 'other'],
      ['3900', 'Reserves', 'equity', 'reserve'], ['4000', 'Revenue', 'revenue', null], ['5000', 'Cost of goods sold', 'expense', null], ['6000', 'Operating expenses', 'expense', null],
    ]
    const ts = nowIso()
    await c.env.DB.batch([
      ...defs.map(([code, name, type, sub]) => c.env.DB.prepare(`INSERT INTO finance_accounts (id, workspace_id, venture_id, code, name, account_type, currency, is_active, created_at, subtype) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
        .bind(newId('fac'), access.workspaceId, access.ventureId, code, name, type, body.currency, ts, sub)),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'finance.default_chart_created', targetType: 'venture', targetId: access.ventureId, requestId: c.get('requestId'), metadata: { currency: body.currency } }),
    ])
    return ok(c, { created: defs.length }, 201)
  })

  // ---- Journals ----------------------------------------------------------------------------
  app.get('/ventures/:vid/finance/journals', async (c) => {
    const { access } = await ventureCtx(c, 'finance.read')
    const entries = (await c.env.DB.prepare(
      `SELECT e.id, e.entry_number, e.entry_date, e.description, e.currency, e.status, e.reversal_of_entry_id, e.posted_at, e.created_at, e.posting_note,
              cp.display_name AS prepared_by, pp.display_name AS posted_by,
              (SELECT r.id FROM journal_entries r WHERE r.reversal_of_entry_id = e.id) AS reversed_by_entry_id
       FROM journal_entries e JOIN people cp ON cp.id = e.created_by_person_id LEFT JOIN people pp ON pp.id = e.posted_by_person_id
       WHERE e.venture_id = ? ORDER BY e.entry_date DESC, e.created_at DESC LIMIT 200`,
    ).bind(access.ventureId).all<{ id: string }>()).results
    const lines = entries.length ? (await c.env.DB.prepare(
      `SELECT l.journal_entry_id, l.account_id, a.code, a.name, l.description, l.debit_minor, l.credit_minor FROM journal_lines l JOIN finance_accounts a ON a.id = l.account_id
       WHERE l.journal_entry_id IN (${entries.map(() => '?').join(',')}) ORDER BY l.rowid`,
    ).bind(...entries.map((e) => e.id)).all<{ journal_entry_id: string }>()).results : []
    return ok(c, { journals: entries.map((e) => ({ ...e, lines: lines.filter((l) => l.journal_entry_id === e.id) })) })
  })

  app.post('/ventures/:vid/finance/journals', async (c) => {
    const { p, access } = await ventureCtx(c, 'finance.draft')
    const body = await parseJson(c, z.object({
      entry_date: z.string().regex(DATE), description: z.string().trim().min(3).max(300), currency: CUR,
      source_type: z.enum(['manual', 'order', 'contribution', 'budget', 'other']).optional(), source_id: z.string().max(64).optional(),
      lines: z.array(z.object({ account_id: z.string(), debit_minor: Minor.default(0), credit_minor: Minor.default(0), description: z.string().trim().max(200).optional() })).min(2).max(50),
    }).strict())
    const accounts = await loadAccounts(c.env, access.ventureId, [...new Set(body.lines.map((l) => l.account_id))])
    validateLines(body.lines, accounts, body.currency)
    const id = newId('jre')
    const ts = nowIso()
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO journal_entries (id, workspace_id, venture_id, entry_number, entry_date, description, currency, status, source_type, source_id, created_by_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, await nextEntryNumber(c.env, access.ventureId), body.entry_date, body.description, body.currency, body.source_type ?? 'manual', body.source_id ?? null, p.personId, ts),
      ...body.lines.map((l) => c.env.DB.prepare(`INSERT INTO journal_lines (id, journal_entry_id, account_id, description, debit_minor, credit_minor) VALUES (?, ?, ?, ?, ?, ?)`).bind(newId('jln'), id, l.account_id, l.description ?? null, l.debit_minor, l.credit_minor)),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'journal.drafted', targetType: 'journal_entry', targetId: id, requestId: c.get('requestId') }),
    ])
    return ok(c, { journal: { id, status: 'draft' } }, 201)
  })

  app.post('/finance/journals/:id/post', async (c) => {
    const { p, access, id } = await recordCtx(c, 'journal_entries', 'finance.post', 'Journal entry')
    const body = await parseJson(c, z.object({ note: z.string().trim().max(300).optional() }))
    const { result } = await withIdempotency(c.env, `journal-post:${id}`, c.req.header('Idempotency-Key'), body, async () => {
      const e = await c.env.DB.prepare(`SELECT status, currency, entry_date, created_by_person_id FROM journal_entries WHERE id = ?`).bind(id).first<{ status: string; currency: string; entry_date: string; created_by_person_id: string }>()
      if (e!.status !== 'draft') throw new AppError('CONFLICT', 'Only draft entries can be posted.')
      if (e!.created_by_person_id === p.personId) throw new AppError('FORBIDDEN', 'Maker-checker: the preparer cannot post their own entry.')
      const lines = (await c.env.DB.prepare(`SELECT account_id, debit_minor, credit_minor FROM journal_lines WHERE journal_entry_id = ?`).bind(id).all<Line>()).results
      const accounts = await loadAccounts(c.env, access.ventureId, [...new Set(lines.map((l) => l.account_id))])
      validateLines(lines, accounts, e!.currency)
      const expense = lines.filter((l) => accounts.get(l.account_id)!.account_type === 'expense').reduce((s, l) => s + l.debit_minor - l.credit_minor, 0)
      if (expense > 0) {
        const b = await budgetStatus(c.env, access.ventureId)
        if (!b) throw new AppError('BUDGET_EXCEEDED', 'Expense postings require an approved venture budget.')
        if (b.currency !== e!.currency) throw new AppError('BUDGET_EXCEEDED', 'The approved budget uses a different currency.')
        if ((b.period_start && e!.entry_date < b.period_start) || (b.period_end && e!.entry_date > b.period_end)) throw new AppError('BUDGET_EXCEEDED', 'Entry date is outside the approved budget period.')
        if (b.spent_minor + expense > b.cap_minor) throw new AppError('BUDGET_EXCEEDED', 'Posting would exceed the approved budget.', { cap_minor: b.cap_minor, spent_minor: b.spent_minor, requested_minor: expense })
      }
      const ts = nowIso()
      await c.env.DB.batch([
        c.env.DB.prepare(`UPDATE journal_entries SET status = 'posted', posted_by_person_id = ?, posted_at = ?, posting_note = ? WHERE id = ? AND status = 'draft'`).bind(p.personId, ts, body.note ?? null, id),
        auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'journal.posted', targetType: 'journal_entry', targetId: id, requestId: c.get('requestId'), metadata: { expense_minor: expense } }),
      ])
      return { status: 'posted', posted_at: ts }
    })
    return ok(c, result)
  })

  app.post('/finance/journals/:id/reverse', async (c) => {
    const { p, access, id } = await recordCtx(c, 'journal_entries', 'finance.post', 'Journal entry')
    const body = await parseJson(c, z.object({ reason: z.string().trim().min(3).max(300), entry_date: z.string().regex(DATE).optional() }))
    const { result } = await withIdempotency(c.env, `journal-reverse:${id}`, c.req.header('Idempotency-Key'), body, async () => {
      const e = await c.env.DB.prepare(`SELECT entry_number, status, currency, description, reversal_of_entry_id FROM journal_entries WHERE id = ?`).bind(id).first<{ entry_number: string; status: string; currency: string; description: string; reversal_of_entry_id: string | null }>()
      if (e!.status !== 'posted') throw new AppError('CONFLICT', 'Only posted entries can be reversed.')
      if (e!.reversal_of_entry_id) throw new AppError('CONFLICT', 'A reversal entry cannot itself be reversed.')
      const done = await c.env.DB.prepare(`SELECT 1 AS ok FROM journal_entries WHERE reversal_of_entry_id = ?`).bind(id).first()
      if (done) throw new AppError('CONFLICT', 'This entry has already been reversed.')
      const lines = (await c.env.DB.prepare(`SELECT account_id, debit_minor, credit_minor, description FROM journal_lines WHERE journal_entry_id = ?`).bind(id).all<Line>()).results
      const rid = newId('jre')
      const ts = nowIso()
      try {
        await c.env.DB.batch([
          c.env.DB.prepare(`INSERT INTO journal_entries (id, workspace_id, venture_id, entry_number, entry_date, description, currency, status, source_type, source_id, reversal_of_entry_id, created_by_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 'reversal', ?, ?, ?, ?)`)
            .bind(rid, access.workspaceId, access.ventureId, await nextEntryNumber(c.env, access.ventureId), body.entry_date ?? ts.slice(0, 10), `Reversal of ${e!.entry_number}: ${body.reason}`, e!.currency, id, id, p.personId, ts),
          ...lines.map((l) => c.env.DB.prepare(`INSERT INTO journal_lines (id, journal_entry_id, account_id, description, debit_minor, credit_minor) VALUES (?, ?, ?, ?, ?, ?)`).bind(newId('jln'), rid, l.account_id, `Reversal: ${l.description ?? ''}`.trim(), l.credit_minor, l.debit_minor)),
          c.env.DB.prepare(`UPDATE journal_entries SET status = 'posted', posted_by_person_id = ?, posted_at = ?, posting_note = ? WHERE id = ?`).bind(p.personId, ts, body.reason, rid),
          auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'journal.reversed', targetType: 'journal_entry', targetId: id, requestId: c.get('requestId'), reason: body.reason, metadata: { reversal_entry_id: rid } }),
        ])
      } catch (err) {
        if (String(err).includes('UNIQUE')) throw new AppError('CONFLICT', 'This entry has already been reversed.')
        throw err
      }
      return { reversal_entry_id: rid }
    })
    return ok(c, result, 201)
  })

  // ---- Reconciliation & reports ------------------------------------------------------------
  // A caller-supplied observation can be compared, never accepted as payment evidence.
  app.post('/ventures/:vid/finance/order-match-preview', async (c) => {
    const { access } = await ventureCtx(c, 'finance.read')
    const body = await parseJson(c, z.object({
      order_id: z.string().min(1).max(100), reference: z.string().trim().min(1).max(120),
      currency: z.string().regex(/^[A-Z]{3}$/), amount_minor: z.string().regex(/^(0|[1-9][0-9]{0,21})$/),
      observed_status: z.enum(['settled', 'pending', 'failed', 'refunded']),
    }).strict())
    const order = await c.env.DB.prepare(`SELECT currency, quantity, unit_price_minor, status FROM orders
      WHERE id = ? AND workspace_id = ? AND venture_id = ?`).bind(body.order_id, access.workspaceId, access.ventureId)
      .first<{ currency: string; quantity: number; unit_price_minor: number; status: string }>()
    if (!order) throw new AppError('NOT_FOUND', 'Order not found.')
    const expected = BigInt(order.quantity) * BigInt(order.unit_price_minor)
    const discrepancies = [
      ...(body.currency !== order.currency ? ['currency'] : []),
      ...(BigInt(body.amount_minor) !== expected ? ['amount'] : []),
      ...(body.observed_status !== 'settled' ? ['status'] : []),
      ...(!['confirmed', 'fulfilled'].includes(order.status) ? ['order_status'] : []),
    ]
    return ok(c, { status: discrepancies.length ? 'difference' : 'candidate_match', verified_payment: false,
      expected_amount_minor: String(expected), expected_currency: order.currency, discrepancies })
  })

  app.get('/ventures/:vid/finance/reconciliations', async (c) => {
    const { access } = await ventureCtx(c, 'finance.read')
    const rows = (await c.env.DB.prepare(`SELECT r.*, a.code, a.name AS account_name FROM reconciliations r JOIN finance_accounts a ON a.id = r.account_id WHERE r.venture_id = ? ORDER BY r.created_at DESC LIMIT 100`).bind(access.ventureId).all()).results
    return ok(c, { reconciliations: rows })
  })

  app.post('/ventures/:vid/finance/reconciliations', async (c) => {
    const { p, access } = await ventureCtx(c, 'finance.post')
    const body = await parseJson(c, z.object({ account_id: z.string(), statement_date: z.string().regex(DATE), statement_balance_minor: z.number().int(), note: z.string().trim().max(500).optional() }).strict())
    const a = await c.env.DB.prepare(`SELECT account_type FROM finance_accounts WHERE id = ? AND venture_id = ?`).bind(body.account_id, access.ventureId).first<{ account_type: string }>()
    if (!a) throw new AppError('VALIDATION_ERROR', 'Account not found in this venture.')
    const bal = await c.env.DB.prepare(
      `SELECT COALESCE(SUM(l.debit_minor),0) AS dr, COALESCE(SUM(l.credit_minor),0) AS cr FROM journal_lines l JOIN journal_entries e ON e.id = l.journal_entry_id
       WHERE l.account_id = ? AND e.status = 'posted' AND e.entry_date <= ?`,
    ).bind(body.account_id, body.statement_date).first<{ dr: number; cr: number }>()
    const ledger = ['asset', 'expense'].includes(a.account_type) ? bal!.dr - bal!.cr : bal!.cr - bal!.dr
    const diff = body.statement_balance_minor - ledger
    const id = newId('rec')
    await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO reconciliations (id, workspace_id, venture_id, account_id, statement_date, statement_balance_minor, ledger_balance_minor, difference_minor, status, note, created_by_person_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, access.workspaceId, access.ventureId, body.account_id, body.statement_date, body.statement_balance_minor, ledger, diff, diff === 0 ? 'matched' : 'difference', body.note ?? null, p.personId, nowIso()),
      auditStatement(c.env, { workspaceId: access.workspaceId, ventureId: access.ventureId, actorPersonId: p.personId, action: 'finance.reconciled', targetType: 'finance_account', targetId: body.account_id, requestId: c.get('requestId'), metadata: { difference_minor: diff } }),
    ])
    return ok(c, { reconciliation: { id, ledger_balance_minor: ledger, difference_minor: diff, status: diff === 0 ? 'matched' : 'difference' } }, 201)
  })

  app.get('/ventures/:vid/finance/report', async (c) => {
    const { access } = await ventureCtx(c, 'finance.read')
    const rows = (await c.env.DB.prepare(
      `SELECT a.currency, a.account_type, a.subtype, COALESCE(SUM(l.debit_minor),0) AS dr, COALESCE(SUM(l.credit_minor),0) AS cr
       FROM finance_accounts a LEFT JOIN journal_lines l ON l.account_id = a.id LEFT JOIN journal_entries e ON e.id = l.journal_entry_id
       WHERE a.venture_id = ? AND (e.id IS NULL OR e.status = 'posted') GROUP BY a.currency, a.account_type, a.subtype`,
    ).bind(access.ventureId).all<{ currency: string; account_type: string; subtype: string | null; dr: number; cr: number }>()).results
    const byCur: Record<string, Record<string, number>> = {}
    for (const r of rows) {
      const t = (byCur[r.currency] ??= { assets: 0, cash: 0, receivables: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0, debits: 0, credits: 0 })
      const debitNature = ['asset', 'expense'].includes(r.account_type)
      const bal = debitNature ? r.dr - r.cr : r.cr - r.dr
      t.debits! += r.dr
      t.credits! += r.cr
      if (r.account_type === 'asset') { t.assets! += bal; if (r.subtype === 'cash') t.cash! += bal; if (r.subtype === 'receivable') t.receivables! += bal }
      if (r.account_type === 'liability') t.liabilities! += bal
      if (r.account_type === 'equity') t.equity! += bal
      if (r.account_type === 'revenue') t.revenue! += bal
      if (r.account_type === 'expense') t.expenses! += bal
    }
    const report = Object.entries(byCur).map(([currency, t]) => ({ currency, ...t, net_result: t.revenue! - t.expenses!, trial_balance_ok: t.debits === t.credits }))
    return ok(c, {
      report, budget: await budgetStatus(c.env, access.ventureId),
      notes: ['Derived only from posted journal entries.', 'Net result is accounting profit/loss, not cash and not distributable surplus.', 'Any distribution requires a separate human governance decision and executed agreement.'],
    })
  })
}
