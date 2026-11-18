import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ActionForm, DataTable, fmtMoney, Section, useRunner } from '../components/kit'
import { Badge, ErrorBox, Loading } from '../components/ui'
import { newIdempotencyKey } from '../lib/api'
import { useLoad } from '../lib/hooks'

type Account = { id: string; code: string; name: string; account_type: string; currency: string; balance_minor: number }
type Budget = { id: string; version: number; currency: string; cap_minor: number; status: string; period_start: string; period_end: string; lines: { category: string; description: string; amount_minor: number }[] }
type BudgetStatus = { currency: string; cap_minor: number; spent_minor: number; remaining_minor: number } | null
type Journal = { id: string; entry_number: string; entry_date: string; description: string; currency: string; status: string; prepared_by: string; posted_by: string | null; reversal_of_entry_id: string | null; reversed_by_entry_id: string | null; lines: { code: string; name: string; debit_minor: number; credit_minor: number }[] }
type Report = { report: Record<string, number | string | boolean>[]; notes: string[] }

export default function VentureFinance() {
  const { vid } = useParams()
  const acc = useLoad((a) => a.get<{ accounts: Account[] }>(`/ventures/${vid}/finance/accounts`), [vid])
  const bud = useLoad((a) => a.get<{ budgets: Budget[]; current: BudgetStatus }>(`/ventures/${vid}/budgets`), [vid])
  const jr = useLoad((a) => a.get<{ journals: Journal[] }>(`/ventures/${vid}/finance/journals`), [vid])
  const rep = useLoad((a) => a.get<Report>(`/ventures/${vid}/finance/report`), [vid])
  const rec = useLoad((a) => a.get<{ reconciliations: Record<string, unknown>[] }>(`/ventures/${vid}/finance/reconciliations`), [vid])
  const reload = async () => { await Promise.all([acc.reload(), bud.reload(), jr.reload(), rep.reload(), rec.reload()]) }
  const r = useRunner(reload)
  const [lines, setLines] = useState([{ account_id: '', debit_minor: 0, credit_minor: 0 }, { account_id: '', debit_minor: 0, credit_minor: 0 }])
  if (acc.loading && !acc.data) return <Loading />
  if (acc.error) return <ErrorBox error={acc.error} />
  const accounts = acc.data!.accounts
  const accOpts = accounts.map((a) => ({ value: a.id, label: `${a.code} ${a.name} (${a.currency})` }))
  const dr = lines.reduce((s, l) => s + l.debit_minor, 0), cr = lines.reduce((s, l) => s + l.credit_minor, 0)
  const cur = bud.data?.current
  return (
    <div className="space-y-8">
      <r.ErrorView />
      <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">Semua angka dalam satuan minor (mis. rupiah penuh). Ledger mencatat; ia tidak memindahkan uang. Laba akuntansi ≠ kas ≠ surplus yang dapat dibagikan.</p>

      <Section title="Anggaran">
        {cur ? <p className="text-sm text-slate-300">Anggaran disetujui: batas {fmtMoney(cur.cap_minor, cur.currency)} · terpakai {fmtMoney(cur.spent_minor)} · sisa <strong>{fmtMoney(cur.remaining_minor)}</strong></p> : <p className="text-sm text-amber-300">Belum ada anggaran yang disetujui — posting beban akan ditolak.</p>}
        <DataTable rows={(bud.data?.budgets ?? []) as unknown as Record<string, unknown>[]} cols={[{ key: 'version', label: 'Ver' }, { key: 'status', label: 'Status' }, { key: 'currency', label: 'Mata uang' }, { key: 'cap_minor', label: 'Batas' },
          { key: 'period', label: 'Periode', render: (b) => `${b.period_start} → ${b.period_end}` },
          { key: 'act', label: '', render: (b) => b.status === 'draft' && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => { const why = r.ask('Alasan pengajuan anggaran:'); if (why) void r.run(() => bud.api.post(`/budgets/${b.id}/submit`, { rationale: why })) }}>Ajukan</button> }]} />
        <ActionForm title="Draft anggaran (satu baris)" fields={[
          { name: 'currency', label: 'Mata uang', defaultValue: 'IDR', required: true }, { name: 'amount_minor', label: 'Jumlah', type: 'number', required: true },
          { name: 'period_start', label: 'Mulai', type: 'date', required: true }, { name: 'period_end', label: 'Selesai', type: 'date', required: true },
          { name: 'category', label: 'Kategori', required: true, defaultValue: 'operations' }, { name: 'description', label: 'Deskripsi', required: true },
        ]} submit={(b) => bud.api.post(`/ventures/${vid}/budgets`, { currency: b.currency, period_start: b.period_start, period_end: b.period_end, lines: [{ category: b.category, description: b.description, amount_minor: b.amount_minor }] })} onDone={reload} />
      </Section>

      <Section title="Bagan akun" actions={accounts.length === 0 && <button className="btn-ghost" disabled={r.busy} onClick={() => void r.run(() => acc.api.post(`/ventures/${vid}/finance/accounts/defaults`, { currency: 'IDR' }))}>Buat bagan akun standar (IDR)</button>}>
        <DataTable rows={accounts as unknown as Record<string, unknown>[]} cols={[{ key: 'code', label: 'Kode' }, { key: 'name', label: 'Nama' }, { key: 'account_type', label: 'Tipe' }, { key: 'currency', label: 'Mata uang' }, { key: 'balance_minor', label: 'Saldo' }]} empty="Belum ada akun." />
      </Section>

      {accounts.length > 0 && (
        <Section title="Jurnal (double-entry)">
          <form className="card space-y-3" onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            void r.run(async () => { await jr.api.post(`/ventures/${vid}/finance/journals`, { entry_date: fd.get('entry_date'), description: fd.get('description'), currency: fd.get('currency'), lines: lines.filter((l) => l.account_id) }); setLines(lines.map(() => ({ account_id: '', debit_minor: 0, credit_minor: 0 }))) })
          }} aria-label="Draft jurnal">
            <h3 className="font-medium text-white">Draft entri jurnal</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="label" htmlFor="je-date">Tanggal</label><input id="je-date" name="entry_date" type="date" className="input" required defaultValue={new Date().toISOString().slice(0, 10)} /></div>
              <div><label className="label" htmlFor="je-cur">Mata uang</label><input id="je-cur" name="currency" className="input" defaultValue="IDR" required /></div>
              <div><label className="label" htmlFor="je-desc">Deskripsi</label><input id="je-desc" name="description" className="input" required minLength={3} /></div>
            </div>
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-3">
                <select aria-label={`Akun baris ${i + 1}`} className="input" value={l.account_id} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, account_id: e.target.value } : x))}><option value="">— akun —</option>{accOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                <input aria-label={`Debit baris ${i + 1}`} type="number" min={0} className="input" value={l.debit_minor} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, debit_minor: Number(e.target.value) } : x))} />
                <input aria-label={`Kredit baris ${i + 1}`} type="number" min={0} className="input" value={l.credit_minor} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, credit_minor: Number(e.target.value) } : x))} />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button type="button" className="btn-ghost py-1" onClick={() => setLines([...lines, { account_id: '', debit_minor: 0, credit_minor: 0 }])}>+ baris</button>
              <span className={dr === cr && dr > 0 ? 'text-emerald-300' : 'text-orange-300'}>Debit {fmtMoney(dr)} · Kredit {fmtMoney(cr)} {dr === cr && dr > 0 ? '✓ seimbang' : '— belum seimbang'}</span>
              <button className="btn-primary" disabled={r.busy || dr !== cr || dr === 0}>Simpan draft</button>
            </div>
            <p className="text-xs text-slate-500">Maker-checker: pembuat draft tidak dapat memposting entrinya sendiri. Koreksi hanya melalui satu entri pembalik.</p>
          </form>
          <ul className="space-y-2">{jr.data?.journals.map((j) => (
            <li key={j.id} className="card p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-slate-400">{j.entry_number}</span><Badge value={j.status} /><span className="text-white">{j.description}</span><span className="text-xs text-slate-500">{j.entry_date} · {j.currency} · dibuat {j.prepared_by}{j.posted_by ? ` · diposting ${j.posted_by}` : ''}</span>
                {j.reversed_by_entry_id && <Badge value="reversed" />}
                <span className="ml-auto flex gap-2">
                  {j.status === 'draft' && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => void r.run(() => jr.api.post(`/finance/journals/${j.id}/post`, {}, { 'Idempotency-Key': newIdempotencyKey() }))}>Posting</button>}
                  {j.status === 'posted' && !j.reversed_by_entry_id && !j.reversal_of_entry_id && <button className="btn-danger py-1" disabled={r.busy} onClick={() => { const why = r.ask('Alasan pembalikan:'); if (why) void r.run(() => jr.api.post(`/finance/journals/${j.id}/reverse`, { reason: why }, { 'Idempotency-Key': newIdempotencyKey() })) }}>Balik</button>}
                </span></div>
              <table className="mt-2 w-full text-xs text-slate-300"><tbody>{j.lines.map((l, i) => <tr key={i}><td className="py-0.5">{l.code} {l.name}</td><td className="text-right">{l.debit_minor ? fmtMoney(l.debit_minor) : ''}</td><td className="text-right">{l.credit_minor ? fmtMoney(l.credit_minor) : ''}</td></tr>)}</tbody></table>
            </li>))}</ul>
        </Section>
      )}

      <Section title="Rekonsiliasi & laporan">
        {accounts.length > 0 && <ActionForm title="Rekonsiliasi akun" fields={[{ name: 'account_id', label: 'Akun', type: 'select', options: accOpts }, { name: 'statement_date', label: 'Tanggal laporan bank', type: 'date', required: true }, { name: 'statement_balance_minor', label: 'Saldo laporan', type: 'number', required: true }, { name: 'note', label: 'Catatan' }]} submit={(b) => rec.api.post(`/ventures/${vid}/finance/reconciliations`, b)} onDone={reload} />}
        <DataTable rows={rec.data?.reconciliations ?? []} cols={[{ key: 'statement_date', label: 'Tanggal' }, { key: 'account_id', label: 'Akun' }, { key: 'statement_balance_minor', label: 'Laporan' }, { key: 'ledger_balance_minor', label: 'Ledger' }, { key: 'difference_minor', label: 'Selisih' }, { key: 'status', label: 'Status' }]} empty="Belum ada rekonsiliasi." />
        <DataTable rows={rep.data?.report ?? []} cols={[...['currency', 'cash', 'receivables', 'assets', 'liabilities', 'equity', 'revenue', 'expenses', 'net_result'].map((k) => ({ key: k, label: k })), { key: 'trial_balance_ok', label: 'Neraca saldo', render: (x: Record<string, unknown>) => <Badge value={x.trial_balance_ok ? 'ok' : 'tidak seimbang'} /> }]} empty="Belum ada entri terposting." />
        <ul className="list-disc pl-5 text-xs text-slate-500">{rep.data?.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </Section>
    </div>
  )
}
