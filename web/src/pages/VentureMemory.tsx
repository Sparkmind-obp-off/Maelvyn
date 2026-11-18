import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ActionForm, DataTable, Section, useRunner } from '../components/kit'
import { Badge, ErrorBox, Loading } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Mem = { id: string; kind: string; content: string; source_type: string; confidence: string; sensitivity: string; status: string; citations_json: string | null; created_by: string | null; created_at: string; retract_reason: string | null }

export default function VentureMemory() {
  const { vid } = useParams()
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [all, setAll] = useState(false)
  const m = useLoad((a) => a.get<{ memory: Mem[] }>(`/ventures/${vid}/memory?q=${encodeURIComponent(query)}${all ? '&include_retracted=1' : ''}`), [vid, query, all])
  const r = useRunner(m.reload)
  if (m.loading && !m.data) return <Loading />
  return (
    <div className="space-y-6">
      <ErrorBox error={m.error} /><r.ErrorView />
      <p className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">Memori terbatas pada venture ini — tidak ada pencarian lintas venture. Setiap pembacaan tercatat. Hanya keputusan dari register approval yang berlabel <em>verified_decision</em>; temuan riset tetap <em>unverified</em>. Catatan tidak dihapus, melainkan ditarik (retract) dengan alasan.</p>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); setQuery(q) }} role="search">
        <input aria-label="Cari memori" className="input max-w-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari di memori venture…" />
        <button className="btn-ghost">Cari</button>
        <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Tampilkan yang ditarik</label>
      </form>
      <Section title="Catatan memori">
        <DataTable rows={(m.data?.memory ?? []) as unknown as Record<string, unknown>[]} cols={[{ key: 'kind', label: 'Jenis' }, { key: 'content', label: 'Isi', render: (x) => <span className="whitespace-pre-wrap">{String(x.content)}</span> },
          { key: 'confidence', label: 'Keyakinan', render: (x) => <Badge value={String(x.confidence)} /> }, { key: 'source_type', label: 'Sumber' },
          { key: 'citations_json', label: 'Sitasi', render: (x) => x.citations_json ? (JSON.parse(String(x.citations_json)) as string[]).map((u) => <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-sky-300 hover:underline">{u}</a>) : '—' },
          { key: 'status', label: 'Status', render: (x) => <><Badge value={String(x.status)} />{x.retract_reason ? <span className="block text-xs text-slate-500">{String(x.retract_reason)}</span> : null}</> },
          { key: 'act', label: '', render: (x) => x.status === 'active' && x.confidence !== 'verified_decision' && <button className="btn-danger py-1" disabled={r.busy} onClick={() => { const why = r.ask('Alasan penarikan:'); if (why) void r.run(() => m.api.post(`/memory/${x.id}/retract`, { reason: why })) }}>Tarik</button> }]} empty="Tidak ada catatan." />
      </Section>
      <ActionForm title="Tambah catatan" fields={[
        { name: 'kind', label: 'Jenis', type: 'select', options: ['insight', 'hypothesis', 'note'] }, { name: 'confidence', label: 'Keyakinan', type: 'select', options: ['unverified', 'hypothesis'] },
        { name: 'sensitivity', label: 'Sensitivitas', type: 'select', options: ['internal', 'confidential'] }, { name: 'content', label: 'Isi', type: 'textarea', required: true },
      ]} submit={(b) => m.api.post(`/ventures/${vid}/memory`, b)} onDone={() => void m.reload()} />
    </div>
  )
}
