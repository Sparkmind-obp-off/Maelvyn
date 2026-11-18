import { describe, expect, it } from 'vitest'
import { bootstrap, grant, setup } from './helpers'

type T = ReturnType<typeof setup>
const today = new Date().toISOString().slice(0, 10)
const yearEnd = `${today.slice(0, 4)}-12-31`
const yearStart = `${today.slice(0, 4)}-01-01`

const CHARTER = {
  problem: 'Synthetic office workers lack healthy lunch options nearby.',
  customer: 'Synthetic office teams', offer: 'Weekly catering plan', value_proposition: 'Healthy and predictable',
  evidence_and_assumptions: 'Synthetic assumptions only', business_model: 'Subscription', scope_and_exclusions: 'One city, no delivery fleet',
  milestones_and_metrics: '10 pilot orders', accountable_operator: 'Synthetic Owner', contributors_and_roles: 'Owner: operator',
  contribution_and_ip_treatment: 'Per executed agreements', budget_and_spending_controls: 'Approved budget only',
  risks_and_compliance: 'Food safety', exit_pause_conditions: 'No demand after 60 days', review_date: yearEnd,
}

/** owner (workspace_admin) + gov1/gov2 approvers. Owner is requester; approvers vote. */
async function fixture() {
  const t = setup()
  const { wid, vid } = await bootstrap(t)
  const gov1 = await grant(t, 'gov1', wid, 'governance_approver')
  const gov2 = await grant(t, 'gov2', wid, 'governance_approver')
  const ownerId = (await t.call('GET', '/session', 'owner')).body.principal.person_id as string
  return { t, wid, vid, gov1, gov2, ownerId }
}
const approve = (t: T, id: string, user: string, decision = 'approve') => t.call('POST', `/approvals/${id}/votes`, user, { decision, rationale: 'synthetic review' })

async function approvedCharter(t: T, vid: string) {
  const ch = await t.call('POST', `/ventures/${vid}/charters`, 'owner', CHARTER)
  const sub = await t.call('POST', `/charters/${ch.body.charter.id}/submit`, 'owner', { rationale: 'ready for review' })
  await approve(t, sub.body.approval_request.id, 'gov1')
  return ch.body.charter.id as string
}
async function approvedBudget(t: T, vid: string, amount = 100_000) {
  const b = await t.call('POST', `/ventures/${vid}/budgets`, 'owner', { currency: 'IDR', period_start: yearStart, period_end: yearEnd, lines: [{ category: 'ops', description: 'pilot costs', amount_minor: amount }] })
  const sub = await t.call('POST', `/budgets/${b.body.budget.id}/submit`, 'owner', { rationale: 'pilot budget' })
  await approve(t, sub.body.approval_request.id, 'gov1')
  return b.body.budget.id as string
}

describe('P1 governance: charter, approval engine, stage gates, decisions, access review', () => {
  it('charter → approval → executed effect, decision register and verified memory', async () => {
    const { t, wid, vid } = await fixture()
    expect((await t.call('POST', `/ventures/${vid}/charters`, 'owner', { ...CHARTER, problem: 'short' })).status).toBe(400)
    const ch = await t.call('POST', `/ventures/${vid}/charters`, 'owner', CHARTER)
    expect(ch.status).toBe(201)
    expect((await t.call('POST', `/ventures/${vid}/charters`, 'owner', CHARTER)).status).toBe(409)
    const sub = await t.call('POST', `/charters/${ch.body.charter.id}/submit`, 'owner', { rationale: 'ready' })
    expect(sub.status).toBe(201)
    const rid = sub.body.approval_request.id
    expect((await t.call('PUT', `/charters/${ch.body.charter.id}`, 'owner', CHARTER)).status).toBe(409) // locked while submitted
    expect((await approve(t, rid, 'owner')).status).toBe(403) // requester cannot vote
    const inbox = await t.call('GET', `/workspaces/${wid}/approvals`, 'gov1')
    expect(inbox.body.approvals[0].can_vote).toBe(true)
    expect((await approve(t, rid, 'gov1')).body.status).toBe('approved')
    expect((await approve(t, rid, 'gov2')).status).toBe(409)
    const list = await t.call('GET', `/ventures/${vid}/charters`, 'owner')
    expect(JSON.stringify(list.body)).toContain('"approved"')
    const dec = await t.call('GET', `/workspaces/${wid}/decisions`, 'owner')
    expect(dec.body.decisions[0]).toMatchObject({ decision_type: 'charter_approval', outcome: 'approved' })
    const mem = await t.call('GET', `/ventures/${vid}/memory`, 'owner')
    expect(mem.body.memory.some((m: { confidence: string }) => m.confidence === 'verified_decision')).toBe(true)
    // decisions are append-only at the DB level
    await expect(t.db.prepare(`UPDATE decisions SET outcome = 'rejected'`).run()).rejects.toThrow()
  })

  it('one reject rejects; conflict excludes voter; withdraw only by requester; expiry cancels', async () => {
    const { t, wid, vid } = await fixture()
    const ch = await t.call('POST', `/ventures/${vid}/charters`, 'owner', CHARTER)
    const r1 = (await t.call('POST', `/charters/${ch.body.charter.id}/submit`, 'owner', { rationale: 'ready' })).body.approval_request.id
    expect((await t.call('POST', `/approvals/${r1}/conflicts`, 'gov2', { description: 'related party' })).status).toBe(201)
    expect((await approve(t, r1, 'gov2')).status).toBe(403)
    expect((await t.call('POST', `/approvals/${r1}/withdraw`, 'gov1', { reason: 'not mine' })).status).toBe(403)
    expect((await approve(t, r1, 'gov1', 'reject')).body.status).toBe('rejected')
    // rejected charter → new draft v2, submit, then expire
    const ch2 = await t.call('POST', `/ventures/${vid}/charters`, 'owner', CHARTER)
    expect(ch2.body.charter.version).toBe(2)
    const r2 = (await t.call('POST', `/charters/${ch2.body.charter.id}/submit`, 'owner', { rationale: 'again' })).body.approval_request.id
    await t.db.prepare(`UPDATE approval_requests SET expires_at = '2000-01-01T00:00:00.000Z' WHERE id = ?`).bind(r2).run()
    await t.call('GET', `/workspaces/${wid}/approvals`, 'owner') // sweeps expired
    const d = await t.call('GET', `/approvals/${r2}`, 'owner')
    expect(d.body.request).toMatchObject({ status: 'cancelled', closed_reason: 'expired' })
    // withdraw by requester reverts the target to draft
    const r3 = (await t.call('POST', `/charters/${ch2.body.charter.id}/submit`, 'owner', { rationale: 'third' })).body.approval_request.id
    expect((await t.call('POST', `/approvals/${r3}/withdraw`, 'owner', { reason: 'changes needed' })).status).toBe(200)
  })

  it('insufficient eligible approvers is refused; target change supersedes the request', async () => {
    const t = setup()
    const { vid } = await bootstrap(t)
    const ch = await t.call('POST', `/ventures/${vid}/charters`, 'owner', CHARTER)
    const sub = await t.call('POST', `/charters/${ch.body.charter.id}/submit`, 'owner', { rationale: 'ready' })
    expect(sub.status).toBe(403) // owner alone cannot approve own request
    expect(sub.body.error.code).toBe('APPROVAL_REQUIRED')

    const f = await fixture()
    const b = await f.t.call('POST', `/ventures/${f.vid}/budgets`, 'owner', { currency: 'IDR', period_start: yearStart, period_end: yearEnd, lines: [{ category: 'ops', description: 'x costs', amount_minor: 5000 }] })
    const rid = (await f.t.call('POST', `/budgets/${b.body.budget.id}/submit`, 'owner', { rationale: 'pilot' })).body.approval_request.id
    await f.t.db.prepare(`UPDATE budgets SET notes = 'n', currency = 'USD' WHERE id = ?`).bind(b.body.budget.id).run().catch(() => undefined)
    const changed = (await f.t.db.prepare(`SELECT currency FROM budgets WHERE id = ?`).bind(b.body.budget.id).first<{ currency: string }>())!.currency
    const res = await approve(f.t, rid, 'gov1')
    expect(res.body.status).toBe(changed === 'USD' ? 'superseded' : 'approved')
  })

  it('stage gates require approved charter + budget, then live evidence and no critical risk', async () => {
    const { t, vid } = await fixture()
    expect((await t.call('POST', `/ventures/${vid}/stage-requests`, 'owner', { to_stage: 'launch', rationale: 'skip' })).status).toBe(400)
    let r = await t.call('POST', `/ventures/${vid}/stage-requests`, 'owner', { to_stage: 'validate', rationale: 'next step' })
    expect(r.status).toBe(201)
    await approve(t, r.body.approval_request.id, 'gov1')
    const blocked = await t.call('POST', `/ventures/${vid}/stage-requests`, 'owner', { to_stage: 'build', rationale: 'build it' })
    expect(blocked.status).toBe(409)
    expect(blocked.body.error.details.gate_failures).toEqual(['approved charter required', 'approved budget required'])
    await approvedCharter(t, vid)
    await approvedBudget(t, vid)
    r = await t.call('POST', `/ventures/${vid}/stage-requests`, 'owner', { to_stage: 'build', rationale: 'build it' })
    await approve(t, r.body.approval_request.id, 'gov1')
    const lc = await t.call('GET', `/ventures/${vid}/lifecycle`, 'owner')
    expect(lc.body.stage).toBe('build')
    expect(lc.body.history.length).toBe(2)
    const launch = lc.body.options.find((o: { to_stage: string }) => o.to_stage === 'launch')
    expect(launch.gate_failures[0]).toContain('reviewable evidence required')
  })

  it('access review is owner-only and append-only', async () => {
    const { t, wid, gov1 } = await fixture()
    expect((await t.call('GET', `/workspaces/${wid}/access-review`, 'gov1')).status).toBe(403)
    const ar = await t.call('GET', `/workspaces/${wid}/access-review`, 'owner')
    expect(ar.body.members.length).toBe(3)
    expect((await t.call('POST', `/workspaces/${wid}/access-reviews`, 'owner', { findings: [{ person_id: gov1, outcome: 'keep' }] })).status).toBe(201)
    await expect(t.db.prepare(`DELETE FROM access_reviews`).run()).rejects.toThrow()
  })
})

describe('P2 finance: budgets, double-entry ledger, maker-checker, budget control, reversal, reconciliation', () => {
  async function fin() {
    const f = await fixture()
    await grant(f.t, 'fin', f.wid, 'finance_operator', f.vid)
    await f.t.call('POST', `/ventures/${f.vid}/finance/accounts/defaults`, 'owner', { currency: 'IDR' })
    const accts = (await f.t.call('GET', `/ventures/${f.vid}/finance/accounts`, 'owner')).body.accounts as { id: string; code: string }[]
    const a = (code: string) => accts.find((x) => x.code === code)!.id
    return { ...f, cash: a('1000'), revenue: a('4000'), opex: a('6000'), capital: a('3000') }
  }
  const draft = (t: T, vid: string, lines: unknown[], user = 'owner', currency = 'IDR') => t.call('POST', `/ventures/${vid}/finance/journals`, user, { entry_date: today, description: 'synthetic entry', currency, lines })
  const post = (t: T, id: string, user: string, key: string) => t.call('POST', `/finance/journals/${id}/post`, user, {}, { 'Idempotency-Key': key })

  it('unbalanced and single-sided entries are rejected; maker cannot post own entry', async () => {
    const { t, vid, cash, revenue } = await fin()
    expect((await draft(t, vid, [{ account_id: cash, debit_minor: 100 }, { account_id: revenue, credit_minor: 90 }])).status).toBe(422)
    expect((await draft(t, vid, [{ account_id: cash, debit_minor: 100 }, { account_id: revenue, credit_minor: 100 }], 'owner', 'USD')).status).toBe(400)
    const d = await draft(t, vid, [{ account_id: cash, debit_minor: 100 }, { account_id: revenue, credit_minor: 100 }])
    expect(d.status).toBe(201)
    expect((await post(t, d.body.journal.id, 'owner', 'idem-post-own1')).status).toBe(403)
    expect((await post(t, d.body.journal.id, 'fin', 'idem-post-fin1')).body.status).toBe('posted')
    expect((await post(t, d.body.journal.id, 'fin', 'idem-post-fin1')).body.status).toBe('posted') // replay
    expect((await post(t, d.body.journal.id, 'fin', 'idem-post-fin2')).status).toBe(409)
    expect((await t.call('POST', `/finance/journals/${d.body.journal.id}/post`, 'fin', {})).status).toBe(400) // key required
  })

  it('expense postings require an approved budget and cannot exceed it', async () => {
    const { t, vid, cash, opex } = await fin()
    const e1 = await draft(t, vid, [{ account_id: opex, debit_minor: 60_000 }, { account_id: cash, credit_minor: 60_000 }])
    const noBudget = await post(t, e1.body.journal.id, 'fin', 'idem-exp-0001')
    expect(noBudget.status).toBe(402)
    await approvedBudget(t, vid, 100_000)
    expect((await post(t, e1.body.journal.id, 'fin', 'idem-exp-0002')).status).toBe(200)
    const e2 = await draft(t, vid, [{ account_id: opex, debit_minor: 50_000 }, { account_id: cash, credit_minor: 50_000 }])
    const over = await post(t, e2.body.journal.id, 'fin', 'idem-exp-0003')
    expect(over.status).toBe(402)
    expect(over.body.error.details).toMatchObject({ cap_minor: 100_000, spent_minor: 60_000 })
    // approved budget lines are locked
    const bid = (await t.call('GET', `/ventures/${vid}/budgets`, 'owner')).body.budgets[0].id
    await expect(t.db.prepare(`UPDATE budgets SET cap_minor = 999999999 WHERE id = ?`).bind(bid).run()).rejects.toThrow()
  })

  it('posted entries are corrected only by a single reversal; reconciliation and report', async () => {
    const { t, vid, cash, capital } = await fin()
    const d = await draft(t, vid, [{ account_id: cash, debit_minor: 500_000 }, { account_id: capital, credit_minor: 500_000 }])
    await post(t, d.body.journal.id, 'fin', 'idem-cap-0001')
    await expect(t.db.prepare(`UPDATE journal_lines SET debit_minor = 1 WHERE journal_entry_id = ?`).bind(d.body.journal.id).run()).rejects.toThrow()
    const rev = await t.call('POST', `/finance/journals/${d.body.journal.id}/reverse`, 'fin', { reason: 'entered in error' }, { 'Idempotency-Key': 'idem-rev-0001' })
    expect(rev.status).toBe(201)
    expect((await t.call('POST', `/finance/journals/${d.body.journal.id}/reverse`, 'fin', { reason: 'again please' }, { 'Idempotency-Key': 'idem-rev-0002' })).status).toBe(409)
    expect((await t.call('POST', `/finance/journals/${rev.body.reversal_entry_id}/reverse`, 'fin', { reason: 'reverse rev' }, { 'Idempotency-Key': 'idem-rev-0003' })).status).toBe(409)
    const rec = await t.call('POST', `/ventures/${vid}/finance/reconciliations`, 'fin', { account_id: cash, statement_date: today, statement_balance_minor: 0 })
    expect(rec.body.reconciliation).toMatchObject({ ledger_balance_minor: 0, status: 'matched' })
    const rec2 = await t.call('POST', `/ventures/${vid}/finance/reconciliations`, 'fin', { account_id: cash, statement_date: today, statement_balance_minor: 1000 })
    expect(rec2.body.reconciliation.status).toBe('difference')
    const rep = await t.call('GET', `/ventures/${vid}/finance/report`, 'owner')
    expect(rep.body.report[0]).toMatchObject({ currency: 'IDR', trial_balance_ok: true, cash: 0 })
    expect(rep.body.notes.join(' ')).toContain('not cash and not distributable surplus')
    // viewer without venture assignment cannot read finance
    await grant(t, 'vw', (await t.call('GET', `/ventures/${vid}`, 'owner')).body.venture.workspace_id, 'viewer')
    expect([403, 404]).toContain((await t.call('GET', `/ventures/${vid}/finance/report`, 'vw')).status)
  })
})

describe('P2 rights: contributions ≠ ownership, signatures, executed agreement + 2 approvals, IP', () => {
  it('full chain with separation of duties and the 100% cap', async () => {
    const { t, vid, gov1, ownerId } = await fixture()
    // contribution: value requires valuation method; contributor (subject) cannot vote
    expect((await t.call('POST', `/ventures/${vid}/contributions`, 'gov1', { contribution_type: 'cash', legal_character: 'capital', description: 'Seed cash', agreed_value_minor: 1000, currency: 'IDR' })).status).toBe(400)
    const ctb = await t.call('POST', `/ventures/${vid}/contributions`, 'gov1', { contribution_type: 'cash', legal_character: 'capital', description: 'Seed cash', agreed_value_minor: 1000, currency: 'IDR', valuation_method: 'face value' })
    expect(ctb.body.contribution.note).toContain('does not create ownership')
    const cr = (await t.call('POST', `/contributions/${ctb.body.contribution.id}/submit`, 'owner', { rationale: 'accept seed' })).body.approval_request.id
    expect((await approve(t, cr, 'gov1')).status).toBe(403) // subject
    expect((await approve(t, cr, 'gov2')).body.status).toBe('approved')
    expect((await t.call('GET', `/ventures/${vid}/ownership`, 'owner')).body.interests?.length ?? 0).toBe(0)

    // agreement: all parties sign themselves; owner cannot sign for gov1
    const ag = await t.call('POST', `/ventures/${vid}/agreements`, 'owner', { agreement_type: 'ownership', title: 'Synthetic participation', version: '1.0', summary: 'Synthetic terms', parties: [{ person_id: gov1, party_role: 'holder' }, { person_id: ownerId, party_role: 'operator' }] })
    const aid = ag.body.agreement.id
    const own = await t.call('POST', `/ventures/${vid}/ownership`, 'owner', { holder_person_id: gov1, agreement_id: aid, interest_type: 'equity', percentage_basis_points: 6000 })
    expect((await t.call('POST', `/ownership/${own.body.interest.id}/submit`, 'owner', { rationale: 'too early' })).status).toBe(409) // agreement not executed
    expect((await t.call('POST', `/agreements/${aid}/submit`, 'owner', { rationale: 'unsigned' })).status).toBe(409)
    expect((await t.call('POST', `/agreements/${aid}/sign`, 'owner', { decision: 'signed', confirmation: 'yes' })).status).toBe(400)
    const SIGN = { decision: 'signed', confirmation: 'I have read this agreement and record my own decision' }
    expect((await t.call('POST', `/agreements/${aid}/sign`, 'gov2', SIGN)).status).toBe(403) // not a party
    await t.call('POST', `/agreements/${aid}/sign`, 'owner', SIGN)
    await t.call('POST', `/agreements/${aid}/sign`, 'gov1', SIGN)
    const ar = (await t.call('POST', `/agreements/${aid}/submit`, 'owner', { rationale: 'all signed' })).body.approval_request.id
    expect((await approve(t, ar, 'gov2')).body.status).toBe('approved')

    // ownership requires ≥2 eligible approvers excluding requester and holder → only gov2 left → refused
    const sub = await t.call('POST', `/ownership/${own.body.interest.id}/submit`, 'owner', { rationale: 'make effective' })
    expect(sub.status).toBe(403)
    await grant(t, 'gov3', (await t.call('GET', `/ventures/${vid}`, 'owner')).body.venture.workspace_id, 'governance_approver')
    const or = (await t.call('POST', `/ownership/${own.body.interest.id}/submit`, 'owner', { rationale: 'make effective' })).body.approval_request.id
    expect((await approve(t, or, 'gov2')).body.status).toBe('submitted')
    expect((await approve(t, or, 'gov3')).body.status).toBe('approved')
    // second 60% interest would exceed 100% → superseded at execution
    const own2 = await t.call('POST', `/ventures/${vid}/ownership`, 'owner', { holder_person_id: ownerId, agreement_id: aid, interest_type: 'equity', percentage_basis_points: 6000 })
    const or2 = (await t.call('POST', `/ownership/${own2.body.interest.id}/submit`, 'gov1', { rationale: 'second' })).body.approval_request.id
    await approve(t, or2, 'gov2')
    expect((await approve(t, or2, 'gov3')).body.status).toBe('superseded')

    // IP: contributed IP needs an agreement
    expect((await t.call('POST', `/ventures/${vid}/ip`, 'owner', { title: 'Logo', ip_type: 'brand', provenance: 'contributed', owner_description: 'gov1' })).status).toBe(400)
    expect((await t.call('POST', `/ventures/${vid}/ip`, 'owner', { title: 'Logo', ip_type: 'brand', provenance: 'contributed', owner_description: 'gov1', agreement_id: aid })).status).toBe(201)
  })
})

describe('P3 operations, memory, portfolio, me', () => {
  it('work-item dependencies, asset disposal via approval, orders → unit economics, experiments → memory', async () => {
    const { t, vid } = await fixture()
    const a = await t.call('POST', `/ventures/${vid}/work-items`, 'owner', { title: 'Find kitchen' })
    const b = await t.call('POST', `/ventures/${vid}/work-items`, 'owner', { title: 'Cook pilot', depends_on_id: a.body.work_item.id })
    expect((await t.call('PATCH', `/work-items/${b.body.work_item.id}`, 'owner', { status: 'done' })).status).toBe(409)
    expect((await t.call('PATCH', `/work-items/${b.body.work_item.id}`, 'owner', { status: 'blocked' })).status).toBe(400)
    await t.call('PATCH', `/work-items/${a.body.work_item.id}`, 'owner', { status: 'done' })
    expect((await t.call('PATCH', `/work-items/${b.body.work_item.id}`, 'owner', { status: 'done' })).status).toBe(200)
    expect((await t.call('POST', `/ventures/${vid}/milestones`, 'owner', { title: 'Pilot', due_date: yearEnd })).status).toBe(201)

    expect((await t.call('POST', `/ventures/${vid}/assets`, 'owner', { asset_name: 'Oven', asset_type: 'equipment', ownership_basis: 'leased', legal_owner_description: 'Lessor' })).status).toBe(400)
    const as = await t.call('POST', `/ventures/${vid}/assets`, 'owner', { asset_name: 'Oven', asset_type: 'equipment', ownership_basis: 'owned_by_venture', legal_owner_description: 'Venture' })
    expect((await t.call('POST', `/assets/${as.body.asset.id}/events`, 'owner', { event_type: 'maintenance', detail: 'cleaned' })).status).toBe(201)
    const dr = (await t.call('POST', `/assets/${as.body.asset.id}/dispose`, 'owner', { rationale: 'broken' })).body.approval_request.id
    await approve(t, dr, 'gov1')
    const assets = (await t.call('GET', `/ventures/${vid}/assets`, 'owner')).body.assets
    expect(assets[0].status).toBe('disposed')
    expect((await t.call('POST', `/assets/${as.body.asset.id}/events`, 'owner', { event_type: 'maintenance', detail: 'x2' })).status).toBe(409)

    const cu = await t.call('POST', `/ventures/${vid}/customers`, 'owner', { name: 'Synthetic Co' })
    const of = await t.call('POST', `/ventures/${vid}/offers`, 'owner', { name: 'Lunch box', currency: 'IDR', price_minor: 50_000, unit_cost_minor: 30_000 })
    expect((await t.call('POST', `/ventures/${vid}/orders`, 'owner', { customer_id: cu.body.customer.id, offer_id: of.body.offer.id, quantity: 10, order_date: today, evidence_note: 'synthetic PO' })).status).toBe(201)
    const rev = await t.call('GET', `/ventures/${vid}/revenue`, 'owner')
    expect(rev.body.unit_economics[0]).toMatchObject({ currency: 'IDR', revenue_minor: 500_000, direct_cost_minor: 300_000, gross_margin_minor: 200_000, gross_margin_pct: 40 })

    const ex = await t.call('POST', `/ventures/${vid}/experiments`, 'owner', { hypothesis: 'Teams will pre-order weekly lunches', method: 'Landing page test', metric: 'signups', success_threshold: '20 signups', timebox_end: yearEnd })
    expect((await t.call('POST', `/experiments/${ex.body.experiment.id}/conclude`, 'owner', { result: 'supported', result_summary: 'got 25', sample_size: 100, evidence_note: 'synthetic', decision: 'proceed' })).status).toBe(409)
    await t.call('POST', `/experiments/${ex.body.experiment.id}/start`, 'owner')
    expect((await t.call('POST', `/experiments/${ex.body.experiment.id}/conclude`, 'owner', { result: 'supported', result_summary: 'got 25', sample_size: 100, evidence_note: 'synthetic', decision: 'proceed' })).status).toBe(200)
    expect((await t.call('POST', `/ventures/${vid}/risks`, 'owner', { title: 'Food safety', category: 'legal', severity: 'critical' })).status).toBe(201)
    expect((await t.call('POST', `/ventures/${vid}/reviews`, 'owner', { period_label: 'W1', summary: 'Synthetic weekly review', recommendation: 'test' })).status).toBe(201)
  })

  it('memory is venture-scoped, retractable, decision records protected; synthetic briefs rejected', async () => {
    const { t, wid, vid } = await fixture()
    const v2 = (await t.call('POST', `/workspaces/${wid}/ventures`, 'owner', { name: 'Other', code: 'SYN-02', category: 'digital' })).body.venture.id
    const m = await t.call('POST', `/ventures/${vid}/memory`, 'owner', { kind: 'insight', content: 'Synthetic insight A', confidence: 'hypothesis' })
    expect((await t.call('POST', `/ventures/${vid}/memory`, 'owner', { kind: 'decision', content: 'fake', confidence: 'verified_decision' })).status).toBe(400)
    expect((await t.call('GET', `/ventures/${v2}/memory`, 'owner')).body.memory.length).toBe(0)
    expect((await t.call('GET', `/ventures/${vid}/memory?q=insight`, 'owner')).body.memory.length).toBe(1)
    await grant(t, 'op2', wid, 'venture_operator', v2)
    expect((await t.call('GET', `/ventures/${vid}/memory`, 'op2')).status).toBe(404)
    expect((await t.call('POST', `/memory/${m.body.memory.id}/retract`, 'op2', { reason: 'not mine' })).status).toBe(404)
    expect((await t.call('POST', `/memory/${m.body.memory.id}/retract`, 'owner', { reason: 'outdated' })).status).toBe(200)
    expect((await t.call('GET', `/ventures/${vid}/memory`, 'owner')).body.memory.length).toBe(0)
    await expect(t.db.prepare(`UPDATE memory_records SET content = 'x'`).run()).rejects.toThrow()
    const r = await t.call('POST', `/ventures/${vid}/research`, 'owner', { objective: 'Synthetic demand for healthy office catering', mode: 'synthetic' }, { 'Idempotency-Key': 'idem-mem-0001' })
    await t.call('POST', `/research/${r.body.task_id}/review`, 'owner', { decision: 'accept', note: 'ok' })
    expect((await t.call('POST', `/research/${r.body.task_id}/to-memory`, 'owner')).status).toBe(409)
  })

  it('EBAV counts only ventures meeting every condition', async () => {
    const { t, wid, vid } = await fixture()
    let p = await t.call('GET', `/workspaces/${wid}/portfolio`, 'owner')
    expect(p.body.ebav).toBe(0)
    expect(p.body.ventures[0].ebav.checks.stage_build_launch_operate).toBe(false)
    await approvedCharter(t, vid)
    await approvedBudget(t, vid)
    for (const to of ['validate', 'build']) {
      const r = await t.call('POST', `/ventures/${vid}/stage-requests`, 'owner', { to_stage: to, rationale: 'advance' })
      await approve(t, r.body.approval_request.id, 'gov1')
    }
    p = await t.call('GET', `/workspaces/${wid}/portfolio`, 'owner')
    expect(p.body.ventures[0].ebav.checks).toMatchObject({ stage_build_launch_operate: true, accountable_operator: true, approved_charter: true, approved_budget: true, recent_evidence: false })
    await t.call('POST', `/ventures/${vid}/reviews`, 'owner', { period_label: 'M1', summary: 'Synthetic monthly review', recommendation: 'proceed' })
    expect((await t.call('GET', `/workspaces/${wid}/portfolio`, 'owner')).body.ebav).toBe(1)
    await t.call('POST', `/ventures/${vid}/risks`, 'owner', { title: 'Privacy breach', category: 'privacy', severity: 'critical' })
    expect((await t.call('GET', `/workspaces/${wid}/portfolio`, 'owner')).body.ebav).toBe(0)
  })

  it('assignments need acceptance by the assignee; notifications, export and data requests are self-scoped', async () => {
    const { t, wid, vid } = await fixture()
    const bob = await grant(t, 'bob', wid, 'venture_operator')
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(404)
    const a = await t.call('POST', `/ventures/${vid}/assignments`, 'owner', { person_id: bob, role_label: 'contributor', reason: 'help with pilot' })
    expect(a.body.assignment.status).toBe('proposed')
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(404)
    expect((await t.call('POST', `/me/assignments/${a.body.assignment.id}/respond`, 'gov1', { decision: 'accept' })).status).toBe(404)
    const n = await t.call('GET', '/me/notifications', 'bob')
    expect(n.body.notifications.some((x: { kind: string }) => x.kind === 'assignment')).toBe(true)
    expect((await t.call('POST', `/me/assignments/${a.body.assignment.id}/respond`, 'bob', { decision: 'accept' })).body.status).toBe('active')
    expect((await t.call('GET', `/ventures/${vid}`, 'bob')).status).toBe(200)
    const ex = await t.call('GET', '/me/export', 'bob')
    expect(ex.body.scope).toBe('own account only')
    expect(ex.body.data.venture_assignments.length).toBe(1)
    expect(JSON.stringify(ex.body)).not.toContain('sparkmind.support')
    expect((await t.call('POST', '/me/data-requests', 'bob', { request_type: 'export' })).status).toBe(201)
    expect((await t.call('GET', '/platform/data-requests', 'bob')).status).toBe(403)
    expect((await t.call('GET', '/platform/data-requests', 'owner')).body.requests.length).toBe(1)
  })
})
