import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, ErrorBox, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useLoad } from '../lib/hooks'

type Venture = { id: string; code: string; name: string; description: string | null; category: string; stage: string; status: string }
type WsResp = { workspace: { id: string; name: string; slug: string; is_synthetic: number }; role: string; stats: { ventures: number; tasks: Record<string, number> } }

export default function WorkspacePage() {
  const { wid } = useParams()
  const ws = useLoad((a) => a.get<WsResp>(`/workspaces/${wid}`), [wid])
  const vs = useLoad((a) => a.get<{ ventures: Venture[] }>(`/workspaces/${wid}/ventures`), [wid])
  const [form, setForm] = useState({ name: '', code: '', description: '', category: 'digital' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<ApiRequestError | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      await vs.api.post(`/workspaces/${wid}/ventures`, { ...form, description: form.description || undefined })
      setForm({ name: '', code: '', description: '', category: 'digital' })
      await Promise.all([vs.reload(), ws.reload()])
    } catch (e2) { setErr(e2 as ApiRequestError) } finally { setBusy(false) }
  }

  if (ws.loading && !ws.data) return <Loading />
  if (ws.error) return <ErrorBox error={ws.error} />
  const t = ws.data!.stats.tasks
  return (
    <div>
      <PageHeader title={ws.data!.workspace.name} subtitle={<>Peran Anda: <Badge value={ws.data!.role} /> · {ws.data!.workspace.is_synthetic ? 'workspace sintetis' : 'workspace nyata'}</>} />
      <section aria-label="Statistik" className="mb-8 grid gap-4 sm:grid-cols-4">
        {[['Venture terlihat', ws.data!.stats.ventures], ['Menunggu review', t.awaiting_review ?? 0], ['Diterima', t.accepted ?? 0], ['Diblokir/gagal', (t.blocked ?? 0) + (t.failed ?? 0)]].map(([k, v]) => (
          <div key={String(k)} className="card"><p className="text-xs uppercase tracking-wide text-slate-400">{k}</p><p className="mt-1 text-2xl font-semibold text-white">{v}</p></div>
        ))}
      </section>
      <section aria-labelledby="ventures-heading">
        <h2 id="ventures-heading" className="mb-3 text-lg font-semibold text-white">Venture</h2>
        <p className="mb-4 text-xs text-slate-500">Hanya venture yang Anda ikuti (atau semua, untuk admin/governance) yang ditampilkan. Venture baru selalu berstatus <em>draft</em> — tidak dihitung sebagai venture aktif (EBAV).</p>
        <ErrorBox error={vs.error} />
        <div className="grid gap-3 sm:grid-cols-2">
          {vs.data?.ventures.map((v) => (
            <Link key={v.id} to={`/w/${wid}/v/${v.id}`} className="card block hover:border-sky-700">
              <div className="flex items-center justify-between gap-2"><h3 className="font-medium text-white">{v.name}</h3><span className="font-mono text-xs text-slate-500">{v.code}</span></div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{v.description ?? '—'}</p>
              <div className="mt-3 flex gap-2"><Badge value={v.stage} /><Badge value={v.status} /><Badge value={v.category} /></div>
            </Link>
          ))}
          {vs.data?.ventures.length === 0 && <p className="text-sm text-slate-400">Belum ada venture yang terlihat oleh Anda.</p>}
        </div>
      </section>
      <form onSubmit={create} className="card mt-8 grid max-w-2xl gap-3 sm:grid-cols-2" aria-labelledby="new-venture">
        <h2 id="new-venture" className="font-medium text-white sm:col-span-2">Draft venture baru</h2>
        <div><label className="label" htmlFor="v-name">Nama</label><input id="v-name" className="input" required minLength={3} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="v-code">Kode</label><input id="v-code" className="input font-mono" required pattern="[A-Z0-9-]{2,16}" placeholder="MAEL-01" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="v-desc">Deskripsi masalah/pelanggan</label><textarea id="v-desc" className="input" rows={2} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><label className="label" htmlFor="v-cat">Kategori</label>
          <select id="v-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {['digital', 'commerce', 'productive_asset', 'investment_capital', 'other'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end"><button className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Buat draft'}</button></div>
        <div className="sm:col-span-2"><ErrorBox error={err} /></div>
      </form>
    </div>
  )
}
