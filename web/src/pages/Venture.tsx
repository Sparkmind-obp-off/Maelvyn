import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { ApiRequestError, newIdempotencyKey } from '../lib/api'
import { useLoad } from '../lib/hooks'

type Task = { id: string; objective: string; execution_mode: string; status: string; status_reason: string | null; budget_credits: number; credits_used: number; created_at: string }
type Resp = { venture: { id: string; name: string; code: string; description: string | null; stage: string; status: string; category: string }; role: string; tasks: Task[] }

export default function VenturePage() {
  const { wid, vid } = useParams()
  const { data, error, loading, api } = useLoad((a) => a.get<Resp>(`/ventures/${vid}`), [vid])
  const [objective, setObjective] = useState('')
  const [mode, setMode] = useState<'synthetic' | 'live'>('synthetic')
  const [extract, setExtract] = useState(false)
  const [budget, setBudget] = useState(3)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<ApiRequestError | null>(null)
  const [idem, setIdem] = useState(newIdempotencyKey)
  const nav = useNavigate()

  async function run(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      const r = await api.post<{ task_id: string }>(`/ventures/${vid}/research`, { objective, mode, extract_top_source: extract, budget_credits: budget, max_results: 5 }, { 'Idempotency-Key': idem })
      setIdem(newIdempotencyKey())
      nav(`/w/${wid}/research/${r.task_id}`)
    } catch (e2) { setErr(e2 as ApiRequestError) } finally { setBusy(false) }
  }

  if (loading && !data) return <Loading />
  if (error) return <ErrorBox error={error} />
  const v = data!.venture
  return (
    <div>
      <PageHeader title={v.name} subtitle={<><span className="font-mono">{v.code}</span> · <Badge value={v.stage} /> <Badge value={v.status} /> · peran: {data!.role}</>} />
      {v.description && <p className="mb-6 max-w-3xl text-sm text-slate-300">{v.description}</p>}
      <form onSubmit={run} className="card mb-8 space-y-4" aria-labelledby="research-heading">
        <div>
          <h2 id="research-heading" className="font-medium text-white">Research Brief Agent <span className="text-xs text-slate-500">(L2 Prepare — hanya membuat draft; manusia yang memutuskan)</span></h2>
        </div>
        <div><label className="label" htmlFor="obj">Pertanyaan riset / objektif</label>
          <textarea id="obj" className="input" rows={2} required minLength={10} maxLength={400} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="mis. Permintaan layanan katering sehat untuk kantor kecil di Jakarta" />
        </div>
        <fieldset className="flex flex-wrap gap-6 text-sm">
          <legend className="label">Mode eksekusi</legend>
          <label className="flex items-center gap-2"><input type="radio" name="mode" checked={mode === 'synthetic'} onChange={() => setMode('synthetic')} /> Synthetic (mock, 0 kredit)</label>
          <label className="flex items-center gap-2"><input type="radio" name="mode" checked={mode === 'live'} onChange={() => setMode('live')} /> Live (Tavily; harus diaktifkan admin + batas kredit)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={extract} disabled={mode !== 'live'} onChange={(e) => setExtract(e.target.checked)} /> Ekstrak sumber teratas (Firecrawl)</label>
          <label className="flex items-center gap-2">Anggaran kredit <input type="number" min={0} max={10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="input w-20" /></label>
        </fieldset>
        <ErrorBox error={err} />
        <button className="btn-primary" disabled={busy}>{busy ? 'Menjalankan…' : 'Jalankan riset'}</button>
      </form>
      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading" className="mb-3 text-lg font-semibold text-white">Tugas</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="p-3">Objektif</th><th className="p-3">Mode</th><th className="p-3">Status</th><th className="p-3">Kredit</th><th className="p-3">Dibuat</th></tr></thead>
            <tbody>
              {data!.tasks.map((t) => (
                <tr key={t.id} className="border-t border-slate-800">
                  <td className="p-3"><Link className="text-sky-300 hover:underline" to={`/w/${wid}/research/${t.id}`}>{t.objective}</Link>{t.status_reason && <p className="text-xs text-slate-500">{t.status_reason}</p>}</td>
                  <td className="p-3"><Badge value={t.execution_mode} /></td>
                  <td className="p-3"><Badge value={t.status} /></td>
                  <td className="p-3 text-slate-300">{t.credits_used}/{t.budget_credits}</td>
                  <td className="p-3 text-slate-400">{fmtDate(t.created_at)}</td>
                </tr>
              ))}
              {data!.tasks.length === 0 && <tr><td colSpan={5} className="p-3 text-slate-500">Belum ada tugas.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
