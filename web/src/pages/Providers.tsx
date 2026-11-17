import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useLoad } from '../lib/hooks'

type Provider = {
  id: string; display_name: string; kind: string; capabilities: string[]; secret_ref: string | null; docs_url: string | null; pricing_note: string | null; is_external: number
  live_enabled: number | null; paid_execution_allowed: number | null; daily_credit_cap: number | null; per_task_credit_cap: number | null
  last_health_status: string | null; last_health_at: string | null; credential_configured: boolean; credits_used_today: number
}
type Health = { state: string; detail: string; quota?: { used?: number; limit?: number | null; remaining?: number | null } }
type Switch = { switch_key: string; engaged: number; reason: string | null; updated_at: string }

function ProviderCard({ p, wid, canManage, onChange }: { p: Provider; wid: string; canManage: boolean; onChange: () => void }) {
  const { api } = useLoad(async () => null, [])
  const [health, setHealth] = useState<Health | null>(null)
  const [daily, setDaily] = useState(p.daily_credit_cap ?? 0)
  const [perTask, setPerTask] = useState(p.per_task_credit_cap ?? 0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<ApiRequestError | null>(null)
  const selectable = p.capabilities.includes('search.web') || p.capabilities.includes('extract.page')

  async function check() {
    setBusy(true); setErr(null)
    try { const r = await api.post<{ health: Health }>(`/workspaces/${wid}/providers/${p.id}/health`); setHealth(r.health); onChange() }
    catch (e) { setErr(e as ApiRequestError) } finally { setBusy(false) }
  }
  async function save(live: boolean) {
    setBusy(true); setErr(null)
    try { await api.put(`/workspaces/${wid}/providers/${p.id}`, { live_enabled: live, daily_credit_cap: daily, per_task_credit_cap: perTask }); onChange() }
    catch (e) { setErr(e as ApiRequestError) } finally { setBusy(false) }
  }

  return (
    <article className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div><h3 className="font-medium text-white">{p.display_name}</h3><p className="text-xs text-slate-500">{p.kind} · {p.capabilities.join(', ')}</p></div>
        <div className="flex flex-col items-end gap-1">
          <Badge value={p.live_enabled ? 'live' : p.is_external ? 'DISABLED' : 'synthetic'} />
          {p.last_health_status && <Badge value={p.last_health_status} />}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-1 text-xs text-slate-400">
        <dt>Kredensial server</dt><dd className="text-slate-200">{p.is_external ? (p.credential_configured ? `tersedia (${p.secret_ref ?? 'binding'})` : 'tidak ada') : 'tidak diperlukan'}</dd>
        <dt>Batas harian / per tugas</dt><dd className="text-slate-200">{p.daily_credit_cap ?? 0} / {p.per_task_credit_cap ?? 0}</dd>
        <dt>Terpakai hari ini</dt><dd className="text-slate-200">{p.credits_used_today}</dd>
        <dt>Health terakhir</dt><dd className="text-slate-200">{fmtDate(p.last_health_at)}</dd>
      </dl>
      {p.pricing_note && <p className="text-xs text-slate-500">{p.pricing_note}</p>}
      {health && <p className="rounded bg-slate-950 p-2 text-xs text-slate-300"><Badge value={health.state} /> {health.detail}{health.quota && ` · kuota: ${JSON.stringify(health.quota)}`}</p>}
      <ErrorBox error={err} />
      {canManage && (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          {p.is_external === 1 && <button className="btn-ghost" disabled={busy} onClick={check}>Cek health (endpoint baca, tanpa biaya kredit)</button>}
          {selectable && p.is_external === 1 && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-slate-400">Harian<input type="number" min={0} max={100} className="input w-20" value={daily} onChange={(e) => setDaily(Number(e.target.value))} /></label>
              <label className="text-xs text-slate-400">Per tugas<input type="number" min={0} max={10} className="input w-20" value={perTask} onChange={(e) => setPerTask(Number(e.target.value))} /></label>
              {p.live_enabled ? <button className="btn-danger" disabled={busy} onClick={() => save(false)}>Nonaktifkan live</button>
                : <button className="btn-primary" disabled={busy} onClick={() => save(true)}>Aktifkan live dengan batas ini</button>}
            </div>
          )}
          {!selectable && p.is_external === 1 && <p className="text-xs text-amber-300/80">Butuh allowlist Actor/model + persetujuan anggaran sebelum bisa diaktifkan.</p>}
        </div>
      )}
      {p.docs_url && <a className="text-xs text-sky-400 hover:underline" href={p.docs_url} target="_blank" rel="noopener noreferrer">Dokumentasi resmi</a>}
    </article>
  )
}

export default function ProvidersPage() {
  const { wid } = useParams()
  const prov = useLoad((a) => a.get<{ role: string; providers: Provider[] }>(`/workspaces/${wid}/providers`), [wid])
  const ks = useLoad((a) => a.get<{ system_kill_switch: boolean; switches: Switch[] }>(`/workspaces/${wid}/kill-switches`), [wid])
  const [key, setKey] = useState('all')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState<ApiRequestError | null>(null)
  const canManage = prov.data?.role === 'workspace_admin'

  async function toggle(engaged: boolean, k = key) {
    setErr(null)
    try { await ks.api.put(`/workspaces/${wid}/kill-switches`, { switch_key: k, engaged, reason: reason || (engaged ? 'Engaged from settings' : 'Released from settings') }); setReason(''); await ks.reload() }
    catch (e) { setErr(e as ApiRequestError) }
  }

  if (prov.loading && !prov.data) return <Loading />
  return (
    <div className="space-y-8">
      <PageHeader title="Provider & kontrol biaya" subtitle="Semua provider eksternal mati secara default. Rahasia tidak pernah dikirim ke browser — hanya status tersedia/tidak. Tidak ada fallback otomatis antar provider." />
      <ErrorBox error={prov.error} />
      <div className="grid gap-4 md:grid-cols-2">
        {prov.data?.providers.map((p) => <ProviderCard key={p.id} p={p} wid={wid!} canManage={canManage} onChange={prov.reload} />)}
      </div>
      <section className="card space-y-3" aria-labelledby="ks-heading">
        <h2 id="ks-heading" className="font-medium text-white">Kill switch</h2>
        {ks.data?.system_kill_switch && <p className="text-sm text-rose-300">System kill switch AKTIF (env SYSTEM_KILL_SWITCH).</p>}
        <ul className="space-y-1 text-sm">
          {ks.data?.switches.map((s) => (
            <li key={s.switch_key} className="flex items-center gap-2"><code>{s.switch_key}</code><Badge value={s.engaged ? 'blocked' : 'released'} /><span className="text-xs text-slate-500">{s.reason}</span>
              {canManage && s.engaged === 1 && <button className="btn-ghost py-1" onClick={() => toggle(false, s.switch_key)}>Lepas</button>}</li>
          ))}
          {ks.data?.switches.length === 0 && <li className="text-slate-500">Tidak ada kill switch yang pernah diubah.</li>}
        </ul>
        {canManage && (
          <div className="flex flex-wrap items-end gap-2">
            <select className="input w-56" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Target kill switch">
              {['all', 'agent:research-brief', 'provider:tavily', 'provider:firecrawl', 'provider:apify', 'provider:scrapely'].map((k) => <option key={k}>{k}</option>)}
            </select>
            <input className="input w-64" placeholder="Alasan (wajib)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="btn-danger" onClick={() => toggle(true)}>Aktifkan kill switch</button>
          </div>
        )}
        <ErrorBox error={err} />
      </section>
    </div>
  )
}
