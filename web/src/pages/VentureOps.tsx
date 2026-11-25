import { useParams } from 'react-router-dom'
import { ActionForm, DataTable, fmtMoney, Section, useRunner } from '../components/kit'
import { ErrorBox, Loading } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Rows = Record<string, unknown>[]
const reviewLabels: Record<string, string> = { customer_followup: 'Tindak lanjut pelanggan', content_review: 'Review konten', fulfillment_review: 'Review pemenuhan order' }
type Revenue = { customers: Rows; offers: Rows; orders: Rows; unit_economics: Rows }

export default function VentureOps() {
  const { vid } = useParams()
  const ms = useLoad((a) => a.get<{ milestones: Rows; work_items: Rows }>(`/ventures/${vid}/milestones`), [vid])
  const as = useLoad((a) => a.get<{ assets: (Record<string, unknown> & { events: Rows })[] }>(`/ventures/${vid}/assets`), [vid])
  const rv = useLoad((a) => a.get<Revenue>(`/ventures/${vid}/revenue`), [vid])
  const ex = useLoad((a) => a.get<{ experiments: Rows }>(`/ventures/${vid}/experiments`), [vid])
  const rk = useLoad((a) => a.get<{ risks: Rows }>(`/ventures/${vid}/risks`), [vid])
  const rw = useLoad((a) => a.get<{ reviews: Rows }>(`/ventures/${vid}/reviews`), [vid])
  const reload = async () => { await Promise.all([ms.reload(), as.reload(), rv.reload(), ex.reload(), rk.reload(), rw.reload()]) }
  const r = useRunner(reload)
  if (ms.loading && !ms.data) return <Loading />
  if (ms.error) return <ErrorBox error={ms.error} />
  const api = ms.api
  const items = ms.data!.work_items
  const itemOpts = [{ value: '', label: '— tidak ada —' }, ...items.map((w) => ({ value: String(w.id), label: String(w.title) }))]
  const msOpts = [{ value: '', label: '— tidak ada —' }, ...ms.data!.milestones.map((m) => ({ value: String(m.id), label: String(m.title) }))]
  const setItem = (id: unknown, status: string) => {
    const blocked_reason = status === 'blocked' ? r.ask('Alasan item diblokir:') : undefined
    if (status === 'blocked' && !blocked_reason) return
    void r.run(() => api.patch(`/work-items/${id}`, { status, blocked_reason }))
  }
  return (
    <div className="space-y-8">
      <r.ErrorView />
      <Section title="Milestone & item kerja">
        <DataTable rows={ms.data!.milestones} cols={[{ key: 'title', label: 'Milestone' }, { key: 'due_date', label: 'Tenggat' }, { key: 'owner', label: 'Pemilik' },
          { key: 'status', label: 'Status', render: (m) => <select aria-label="Status milestone" className="input py-1" value={String(m.status)} disabled={r.busy} onChange={(e) => void r.run(() => api.patch(`/milestones/${m.id}`, { status: e.target.value }))}>{['planned', 'in_progress', 'done', 'blocked', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select> }]} empty="Belum ada milestone." />
        <DataTable rows={items} cols={[{ key: 'title', label: 'Item' }, { key: 'assignee', label: 'Penerima' }, { key: 'due_date', label: 'Tenggat' }, { key: 'depends_on_id', label: 'Bergantung pada', render: (w) => w.depends_on_id ? String(items.find((x) => x.id === w.depends_on_id)?.title ?? w.depends_on_id) : '—' },
          { key: 'context', label: 'Jenis', render: (w) => {
            const context = w.context as { kind: string } | null | undefined
            return context ? (reviewLabels[context.kind] ?? 'Internal') : 'Umum'
          } }, { key: 'blocked_reason', label: 'Alasan blokir' },
          { key: 'status', label: 'Status', render: (w) => <select aria-label="Status item" className="input py-1" value={String(w.status)} disabled={r.busy} onChange={(e) => setItem(w.id, e.target.value)}>{['todo', 'doing', 'blocked', 'done', 'cancelled'].map((s) => <option key={s}>{s}</option>)}</select> }]} empty="Belum ada item kerja." />
        <div className="grid gap-4 lg:grid-cols-2">
          <ActionForm title="Milestone baru" fields={[{ name: 'title', label: 'Judul', required: true }, { name: 'due_date', label: 'Tenggat', type: 'date' }, { name: 'description', label: 'Deskripsi', type: 'textarea' }]} submit={(b) => api.post(`/ventures/${vid}/milestones`, b)} onDone={reload} />
          <ActionForm title="Item kerja baru" fields={[{ name: 'title', label: 'Judul', required: true }, { name: 'due_date', label: 'Tenggat', type: 'date' }, { name: 'milestone_id', label: 'Milestone', type: 'select', options: msOpts }, { name: 'depends_on_id', label: 'Bergantung pada', type: 'select', options: itemOpts }]} submit={(b) => api.post(`/ventures/${vid}/work-items`, b)} onDone={reload} />
        </div>
      </Section>

      <Section title="Antrean internal: tindak lanjut, konten, dan fulfillment">
        <p className="text-sm text-slate-400">Tidak mengirim pesan, menerbitkan konten, mengubah order, atau menagih pembayaran. Tenggat dicatat sebagai tanggal UTC.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {(Object.keys(reviewLabels) as Array<keyof typeof reviewLabels>).map((kind) => {
            const isCustomer = kind === 'customer_followup'
            const isContent = kind === 'content_review'
            const options = isCustomer ? (rv.data?.customers ?? []).map((o) => ({ value: String(o.id), label: String(o.name) }))
              : (rv.data?.orders ?? []).map((o) => ({ value: String(o.id), label: `${o.offer_name} · ${o.order_date}` }))
            return <ActionForm key={kind} title={reviewLabels[kind]!} fields={[
              { name: 'title', label: 'Judul', required: true }, { name: 'due_date', label: 'Tenggat', type: 'date', required: true },
              isContent ? { name: 'reference', label: 'ID artefak dari halaman riset', required: true }
                : { name: 'reference', label: isCustomer ? 'Pelanggan' : 'Order', type: 'select', required: true, options: [{ value: '', label: 'Pilih referensi' }, ...options] },
            ]} submit={({ reference, ...data }) => api.post(`/ventures/${vid}/work-items`, { ...data, context: isCustomer
              ? { kind, customer_id: reference } : isContent ? { kind, research_artifact_id: reference } : { kind, order_id: reference } })} onDone={reload} />
          })}
        </div>
      </Section>

      <Section title="Aset">
        <ul className="space-y-2">{as.data?.assets.map((a) => (
          <li key={String(a.id)} className="card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2"><span className="text-white">{String(a.asset_name)}</span><span className="text-xs text-slate-500">{String(a.asset_type)} · {String(a.ownership_basis)} · pemilik hukum: {String(a.legal_owner_description)}</span>
              <span className="badge bg-slate-800 text-slate-300">{String(a.status)}</span>
              {a.status !== 'disposed' && <span className="ml-auto flex gap-2">
                <button className="btn-ghost py-1" disabled={r.busy} onClick={() => { const d = r.ask('Catatan kondisi/perawatan:', 2); if (d) void r.run(() => api.post(`/assets/${a.id}/events`, { event_type: 'condition_report', detail: d })) }}>Catat event</button>
                <button className="btn-danger py-1" disabled={r.busy} onClick={() => { const d = r.ask('Alasan pelepasan aset (butuh approval):'); if (d) void r.run(() => api.post(`/assets/${a.id}/dispose`, { rationale: d })) }}>Ajukan pelepasan</button></span>}</div>
            {a.events.length > 0 && <ul className="mt-2 space-y-0.5 text-xs text-slate-400">{a.events.map((e, i) => <li key={i}>{String(e.event_type)} — {String(e.detail)} ({String(e.created_at).slice(0, 10)})</li>)}</ul>}
          </li>))}{as.data?.assets.length === 0 && <li className="text-sm text-slate-500">Belum ada aset.</li>}</ul>
        <ActionForm title="Catat aset" fields={[
          { name: 'asset_name', label: 'Nama', required: true }, { name: 'asset_type', label: 'Jenis', required: true, placeholder: 'equipment' },
          { name: 'ownership_basis', label: 'Dasar kepemilikan', type: 'select', options: ['owned_by_venture', 'personal_not_contributed', 'leased', 'licensed', 'shared_use', 'under_review'] },
          { name: 'legal_owner_description', label: 'Pemilik hukum', required: true }, { name: 'location', label: 'Lokasi' }, { name: 'condition', label: 'Kondisi' },
        ]} submit={(b) => api.post(`/ventures/${vid}/assets`, b)} onDone={reload} />
      </Section>

      <Section title="Pelanggan, penawaran, order & unit economics">
        <DataTable rows={rv.data?.unit_economics ?? []} cols={[{ key: 'currency', label: 'Mata uang' }, { key: 'orders', label: 'Order' }, { key: 'customers', label: 'Pelanggan' }, { key: 'revenue_minor', label: 'Pendapatan' }, { key: 'direct_cost_minor', label: 'Biaya langsung' }, { key: 'gross_margin_minor', label: 'Margin kotor' }, { key: 'gross_margin_pct', label: 'Margin %' }, { key: 'avg_order_value_minor', label: 'AOV' }, { key: 'paid_minor', label: 'Terbayar' }]} empty="Belum ada order terkonfirmasi." />
        <DataTable rows={rv.data?.orders ?? []} cols={[{ key: 'order_date', label: 'Tanggal' }, { key: 'customer_name', label: 'Pelanggan' }, { key: 'offer_name', label: 'Penawaran' }, { key: 'quantity', label: 'Qty' }, { key: 'unit_price_minor', label: 'Harga' }, { key: 'status', label: 'Status' }, { key: 'payment_status', label: 'Pembayaran' }]} empty="Belum ada order." />
        <div className="grid gap-4 lg:grid-cols-3">
          <ActionForm title="Pelanggan" fields={[{ name: 'name', label: 'Nama', required: true }, { name: 'segment', label: 'Segmen' }]} submit={(b) => api.post(`/ventures/${vid}/customers`, b)} onDone={reload} />
          <ActionForm title="Penawaran" fields={[{ name: 'name', label: 'Nama', required: true }, { name: 'currency', label: 'Mata uang', defaultValue: 'IDR' }, { name: 'price_minor', label: 'Harga', type: 'number', required: true }, { name: 'unit_cost_minor', label: 'Biaya unit', type: 'number' }]} submit={(b) => api.post(`/ventures/${vid}/offers`, b)} onDone={reload} />
          <ActionForm title="Order" fields={[
            { name: 'customer_id', label: 'Pelanggan', type: 'select', options: (rv.data?.customers ?? []).map((c) => ({ value: String(c.id), label: String(c.name) })) },
            { name: 'offer_id', label: 'Penawaran', type: 'select', options: (rv.data?.offers ?? []).map((c) => ({ value: String(c.id), label: `${c.name} (${fmtMoney(Number(c.price_minor), String(c.currency))})` })) },
            { name: 'quantity', label: 'Qty', type: 'number', defaultValue: 1 }, { name: 'order_date', label: 'Tanggal', type: 'date', required: true },
            { name: 'status', label: 'Status', type: 'select', options: ['confirmed', 'quoted', 'fulfilled'] }, { name: 'evidence_note', label: 'Bukti (mis. no. PO)', required: true },
          ]} submit={(b) => api.post(`/ventures/${vid}/orders`, b)} onDone={reload} />
        </div>
      </Section>

      <Section title="Eksperimen">
        <DataTable rows={ex.data?.experiments ?? []} cols={[{ key: 'hypothesis', label: 'Hipotesis' }, { key: 'metric', label: 'Metrik' }, { key: 'success_threshold', label: 'Ambang' }, { key: 'timebox_end', label: 'Batas waktu' }, { key: 'result', label: 'Hasil' }, { key: 'status', label: 'Status' },
          { key: 'act', label: '', render: (x) => <span className="flex gap-2">
            {x.status === 'planned' && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => void r.run(() => api.post(`/experiments/${x.id}/start`))}>Mulai</button>}
            {x.status === 'running' && <button className="btn-primary py-1" disabled={r.busy} onClick={() => {
              const result = window.prompt('Hasil: supported / refuted / inconclusive', 'inconclusive'); if (!result) return
              const summary = r.ask('Ringkasan hasil (min. 5 karakter):', 5); if (!summary) return
              const n = Number(window.prompt('Ukuran sampel:', '0') ?? '0')
              const evidence = r.ask('Catatan bukti:'); if (!evidence) return
              const decision = window.prompt('Keputusan: proceed / test / revise / hold / reject', 'test'); if (!decision) return
              void r.run(() => api.post(`/experiments/${x.id}/conclude`, { result, result_summary: summary, sample_size: n, evidence_note: evidence, decision }))
            }}>Simpulkan</button>}
            {['planned', 'running'].includes(String(x.status)) && <button className="btn-danger py-1" disabled={r.busy} onClick={() => { const why = r.ask('Alasan dihentikan:'); if (why) void r.run(() => api.post(`/experiments/${x.id}/abandon`, { reason: why })) }}>Hentikan</button>}
          </span> }]} empty="Belum ada eksperimen." />
        <ActionForm title="Rancang eksperimen" fields={[
          { name: 'hypothesis', label: 'Hipotesis (min. 10)', type: 'textarea', required: true }, { name: 'method', label: 'Metode', type: 'textarea', required: true },
          { name: 'metric', label: 'Metrik', required: true }, { name: 'success_threshold', label: 'Ambang keberhasilan', required: true },
          { name: 'budget_cap_minor', label: 'Batas biaya', type: 'number' }, { name: 'timebox_end', label: 'Batas waktu', type: 'date', required: true },
        ]} submit={(b) => api.post(`/ventures/${vid}/experiments`, b)} onDone={reload} />
      </Section>

      <Section title="Risiko">
        <DataTable rows={rk.data?.risks ?? []} cols={[{ key: 'title', label: 'Risiko' }, { key: 'category', label: 'Kategori' }, { key: 'severity', label: 'Tingkat' }, { key: 'mitigation', label: 'Mitigasi' }, { key: 'status', label: 'Status' },
          { key: 'act', label: '', render: (x) => x.status === 'open' && <button className="btn-ghost py-1" disabled={r.busy} onClick={() => { const m = r.ask('Mitigasi yang dilakukan:'); if (m) void r.run(() => api.patch(`/risks/${x.id}`, { status: 'mitigated', mitigation: m })) }}>Tandai termitigasi</button> }]} empty="Belum ada risiko." />
        <ActionForm title="Catat risiko" fields={[{ name: 'title', label: 'Judul', required: true }, { name: 'category', label: 'Kategori', type: 'select', options: ['governance', 'legal', 'financial', 'privacy', 'security', 'operational', 'market'] }, { name: 'severity', label: 'Tingkat', type: 'select', options: ['low', 'medium', 'high', 'critical'] }, { name: 'mitigation', label: 'Rencana mitigasi', wide: true }]} submit={(b) => api.post(`/ventures/${vid}/risks`, b)} onDone={reload} />
      </Section>

      <Section title="Review venture">
        <DataTable rows={rw.data?.reviews ?? []} cols={[{ key: 'period_label', label: 'Periode' }, { key: 'reviewer', label: 'Reviewer' }, { key: 'recommendation', label: 'Rekomendasi' }, { key: 'summary', label: 'Ringkasan' }, { key: 'metrics', label: 'Snapshot metrik', render: (x) => <code className="text-xs text-slate-400">{JSON.stringify(x.metrics)}</code> }, { key: 'created_at', label: 'Waktu' }]} empty="Belum ada review." />
        <ActionForm title="Tulis review" note="Metrik di-snapshot otomatis dari catatan saat review dibuat; rekomendasi ditulis oleh manusia." fields={[{ name: 'period_label', label: 'Periode', required: true, placeholder: '2026-W47' }, { name: 'recommendation', label: 'Rekomendasi', type: 'select', options: ['proceed', 'test', 'revise', 'hold', 'reject', 'scale', 'restructure', 'exit'] }, { name: 'summary', label: 'Ringkasan (min. 10)', type: 'textarea', required: true }]} submit={(b) => api.post(`/ventures/${vid}/reviews`, b)} onDone={reload} />
      </Section>
    </div>
  )
}
