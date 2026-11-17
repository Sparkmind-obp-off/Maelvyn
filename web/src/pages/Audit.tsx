import { useParams } from 'react-router-dom'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { useLoad } from '../lib/hooks'

type Ev = { id: string; venture_id: string | null; actor_name: string | null; action: string; target_type: string; target_id: string; reason: string | null; metadata_json: string | null; created_at: string }
type Dec = { action: string; decision: string; reason: string; venture_id: string | null; created_at: string }
type Usage = { usage_date: string; provider_id: string; capability: string; outcome: string; calls: number; credits: number }

export default function AuditPage() {
  const { wid } = useParams()
  const audit = useLoad((a) => a.get<{ events: Ev[]; permission_decisions: Dec[] }>(`/workspaces/${wid}/audit`), [wid])
  const usage = useLoad((a) => a.get<{ usage: Usage[] }>(`/workspaces/${wid}/usage`), [wid])
  if (audit.loading && !audit.data) return <Loading />
  return (
    <div className="space-y-8">
      <PageHeader title="Audit & penggunaan" subtitle="Audit append-only (dijaga trigger database). Metadata disamarkan dari pola kredensial." />
      <ErrorBox error={audit.error} />
      <section aria-labelledby="usage-h">
        <h2 id="usage-h" className="mb-3 font-medium text-white">Penggunaan provider</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="p-2">Tanggal</th><th className="p-2">Provider</th><th className="p-2">Kapabilitas</th><th className="p-2">Hasil</th><th className="p-2">Panggilan</th><th className="p-2">Kredit</th></tr></thead>
          <tbody>{usage.data?.usage.map((u, i) => <tr key={i} className="border-t border-slate-800"><td className="p-2">{u.usage_date}</td><td className="p-2">{u.provider_id}</td><td className="p-2">{u.capability}</td><td className="p-2"><Badge value={u.outcome} /></td><td className="p-2">{u.calls}</td><td className="p-2">{u.credits}</td></tr>)}
            {usage.data?.usage.length === 0 && <tr><td colSpan={6} className="p-2 text-slate-500">Belum ada penggunaan.</td></tr>}</tbody>
        </table></div>
      </section>
      <section aria-labelledby="events-h">
        <h2 id="events-h" className="mb-3 font-medium text-white">Event audit</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="p-2">Waktu</th><th className="p-2">Aktor</th><th className="p-2">Aksi</th><th className="p-2">Target</th><th className="p-2">Detail</th></tr></thead>
          <tbody>{audit.data?.events.map((e) => <tr key={e.id} className="border-t border-slate-800 align-top"><td className="whitespace-nowrap p-2 text-slate-400">{fmtDate(e.created_at)}</td><td className="p-2">{e.actor_name ?? <span className="text-slate-500">system/agent</span>}</td><td className="p-2 font-mono text-xs">{e.action}</td><td className="p-2 text-xs text-slate-400">{e.target_type}:{e.target_id.slice(0, 18)}</td><td className="p-2 text-xs text-slate-500">{e.reason}{e.metadata_json && <code className="block max-w-md truncate">{e.metadata_json}</code>}</td></tr>)}</tbody>
        </table></div>
      </section>
      <section aria-labelledby="dec-h">
        <h2 id="dec-h" className="mb-3 font-medium text-white">Keputusan izin yang ditolak</h2>
        <ul className="space-y-1 text-sm">{audit.data?.permission_decisions.map((d, i) => <li key={i}><Badge value={d.decision === 'deny' ? 'denied' : d.decision} /> <code>{d.action}</code> — {d.reason} <span className="text-xs text-slate-500">{fmtDate(d.created_at)}</span></li>)}
          {audit.data?.permission_decisions.length === 0 && <li className="text-slate-500">Tidak ada.</li>}</ul>
      </section>
    </div>
  )
}
