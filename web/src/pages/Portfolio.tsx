import { Link, useParams } from 'react-router-dom'
import { Badge, ErrorBox, Loading, PageHeader } from '../components/ui'
import { useLoad } from '../lib/hooks'

type V = { id: string; name: string; code: string; stage: string; status: string; ebav: { counts: boolean; checks: Record<string, boolean> } }
type Resp = { ebav: number; ebav_definition: string; ventures: V[]; by_stage: Record<string, number>; pending_approvals: number; scope: string }
const LABELS: Record<string, string> = { stage_build_launch_operate: 'Tahap build/launch/operate', accountable_operator: 'Operator akuntabel aktif', approved_charter: 'Charter disetujui', approved_budget: 'Anggaran disetujui', recent_evidence: 'Bukti ≤90 hari', no_critical_gate: 'Tanpa risiko kritis terbuka' }

export default function PortfolioPage() {
  const { wid } = useParams()
  const { data, error, loading } = useLoad((a) => a.get<Resp>(`/workspaces/${wid}/portfolio`), [wid])
  if (loading && !data) return <Loading />
  if (error) return <ErrorBox error={error} />
  const d = data!
  return (
    <div className="space-y-6">
      <PageHeader title="Portofolio" subtitle={<>EBAV (Evidence-Backed Active Ventures) dihitung dari catatan, bukan diklaim. Cakupan: {d.scope === 'workspace' ? 'seluruh workspace' : 'venture yang ditugaskan kepada Anda saja'}.</>} />
      <section aria-label="Ringkasan portofolio" className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-xs uppercase text-slate-400">EBAV</p><p className="mt-1 text-3xl font-semibold text-white">{d.ebav}</p><p className="text-xs text-slate-500">dari {d.ventures.length} venture terlihat</p></div>
        <div className="card"><p className="text-xs uppercase text-slate-400">Approval tertunda</p><p className="mt-1 text-3xl font-semibold text-white">{d.pending_approvals}</p></div>
        <div className="card"><p className="text-xs uppercase text-slate-400">Per tahap</p><p className="mt-2 flex flex-wrap gap-1">{Object.entries(d.by_stage).map(([k, v]) => <span key={k} className="badge bg-slate-800 text-slate-300">{k}: {v}</span>)}</p></div>
      </section>
      <p className="text-xs text-slate-500">{d.ebav_definition}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="p-3">Venture</th><th className="p-3">Tahap</th>{Object.values(LABELS).map((l) => <th key={l} className="p-3">{l}</th>)}<th className="p-3">EBAV</th></tr></thead>
          <tbody>{d.ventures.map((v) => (
            <tr key={v.id} className="border-t border-slate-800">
              <td className="p-3"><Link className="text-sky-300 hover:underline" to={`/w/${wid}/v/${v.id}`}>{v.name}</Link> <span className="font-mono text-xs text-slate-500">{v.code}</span></td>
              <td className="p-3"><Badge value={v.stage} /></td>
              {Object.keys(LABELS).map((k) => <td key={k} className="p-3" aria-label={`${LABELS[k]}: ${v.ebav.checks[k] ? 'ya' : 'tidak'}`}>{v.ebav.checks[k] ? <span className="text-emerald-300">✓</span> : <span className="text-rose-300">✗</span>}</td>)}
              <td className="p-3"><Badge value={v.ebav.counts ? 'counts' : 'no'} /></td>
            </tr>))}
            {d.ventures.length === 0 && <tr><td colSpan={9} className="p-3 text-slate-500">Belum ada venture.</td></tr>}</tbody>
        </table>
      </div>
    </div>
  )
}
