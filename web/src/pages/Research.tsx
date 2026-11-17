import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useLoad } from '../lib/hooks'

type Brief = {
  objective: string; synthetic: boolean; disclaimer: string; generator: string
  reported_findings: Array<{ statement: string; citations: number[]; classification: string }>
  agent_inferences: Array<{ statement: string; basis: number[]; confidence: string }>
  gaps_and_unknowns: string[]
  suggested_validation_test: { hypothesis: string; method: string; stop_condition: string }
  security_notes: string[]
  sources: Array<{ n: number; url: string; title: string }>
}
type Resp = {
  task: { id: string; venture_id: string; objective: string; execution_mode: string; status: string; status_reason: string | null; autonomy_level: string; budget_credits: number; credits_used: number; contract: Record<string, unknown>; created_at: string } | null
  executions: Array<{ step: string; provider_id: string | null; status: string; detail: unknown; finished_at: string }>
  evidence: Array<{ id: string; provider_id: string; url: string; title: string; evidence_class: string; trust: string; retrieved_at: string; extracted_excerpt: string | null }>
  artifact: { id: string; title: string; status: string; brief: Brief; review_note: string | null; reviewed_at: string | null } | null
}

/** Renders external URLs as plain text links only for http(s); React escapes all text (no HTML rendering). */
function SafeLink({ url, children }: { url: string; children: React.ReactNode }) {
  const ok = /^https?:\/\//i.test(url) && !url.includes('.example.invalid')
  return ok ? <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="text-sky-300 hover:underline">{children}</a> : <span className="text-slate-300">{children}</span>
}

export default function ResearchPage() {
  const { wid, tid } = useParams()
  const { data, error, loading, reload, api } = useLoad((a) => a.get<Resp>(`/research/${tid}`), [tid])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<ApiRequestError | null>(null)
  const [showContract, setShowContract] = useState(false)

  async function review(decision: 'accept' | 'reject') {
    setBusy(true); setErr(null)
    try { await api.post(`/research/${tid}/review`, { decision, note: note || undefined }); await reload() }
    catch (e) { setErr(e as ApiRequestError) } finally { setBusy(false) }
  }

  if (loading && !data) return <Loading />
  if (error) return <ErrorBox error={error} />
  const t = data!.task!
  const b = data!.artifact?.brief
  return (
    <div className="space-y-6">
      <PageHeader title="Research brief" subtitle={<><Link className="text-sky-300 hover:underline" to={`/w/${wid}/v/${t.venture_id}`}>← kembali ke venture</Link> · <Badge value={t.execution_mode} /> <Badge value={t.status} /> · {t.autonomy_level} · kredit {t.credits_used}/{t.budget_credits}</>} />
      <section className="card"><p className="label">Objektif</p><p className="text-slate-100">{t.objective}</p>{t.status_reason && <p className="mt-2 text-sm text-orange-300">{t.status_reason}</p>}</section>

      {b && (
        <article className="card space-y-5" aria-labelledby="brief-title">
          <div className={`rounded-lg p-3 text-sm ${b.synthetic ? 'bg-violet-950/60 text-violet-200' : 'bg-amber-950/50 text-amber-200'}`}>{b.disclaimer}</div>
          <h2 id="brief-title" className="text-lg font-semibold text-white">{data!.artifact!.title} <Badge value={data!.artifact!.status} /></h2>
          <section><h3 className="mb-2 font-medium text-white">Temuan yang dilaporkan sumber (belum terverifikasi)</h3>
            <ul className="space-y-2 text-sm text-slate-300">{b.reported_findings.map((f, i) => <li key={i}>• {f.statement} <span className="text-sky-400">{f.citations.map((c) => `[${c}]`).join('')}</span> <Badge value={f.classification} /></li>)}</ul>
            {b.reported_findings.length === 0 && <p className="text-sm text-slate-500">Tidak ada temuan.</p>}
          </section>
          <section><h3 className="mb-2 font-medium text-white">Inferensi agen (confidence rendah)</h3>
            <ul className="space-y-1 text-sm text-slate-400">{b.agent_inferences.map((f, i) => <li key={i}>• {f.statement} <span className="text-slate-500">basis {f.basis.map((c) => `[${c}]`).join('')}</span></li>)}</ul>
          </section>
          <section><h3 className="mb-2 font-medium text-white">Gap &amp; hal yang belum diketahui</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-400">{b.gaps_and_unknowns.map((g) => <li key={g}>{g}</li>)}</ul>
          </section>
          <section className="rounded-lg border border-slate-800 p-3 text-sm"><h3 className="mb-2 font-medium text-white">Usulan tes validasi termurah</h3>
            <p><span className="text-slate-500">Hipotesis:</span> {b.suggested_validation_test.hypothesis}</p>
            <p><span className="text-slate-500">Metode:</span> {b.suggested_validation_test.method}</p>
            <p><span className="text-slate-500">Stop condition:</span> {b.suggested_validation_test.stop_condition}</p>
          </section>
          <section><h3 className="mb-2 font-medium text-white">Sumber</h3>
            <ol className="space-y-1 text-sm">{b.sources.map((s) => <li key={s.n}>[{s.n}] <SafeLink url={s.url}>{s.title}</SafeLink> <span className="text-xs text-slate-500">{s.url}</span></li>)}</ol>
          </section>
          <section className="text-xs text-slate-500">{b.security_notes.map((s) => <p key={s}>🛡 {s}</p>)}<p>Generator: {b.generator} (ekstraktif, tanpa LLM)</p></section>
        </article>
      )}

      {t.status === 'awaiting_review' && (
        <section className="card space-y-3" aria-labelledby="review-heading">
          <h2 id="review-heading" className="font-medium text-white">Review manusia</h2>
          <p className="text-xs text-slate-500">Menerima brief hanya menandai draft sebagai diterima untuk dipakai sebagai bahan diskusi. Ini bukan keputusan investasi, persetujuan anggaran, atau komitmen.</p>
          <textarea className="input" rows={2} maxLength={1000} placeholder="Catatan review (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <ErrorBox error={err} />
          <div className="flex gap-3"><button className="btn-primary" disabled={busy} onClick={() => review('accept')}>Terima draft</button><button className="btn-danger" disabled={busy} onClick={() => review('reject')}>Tolak</button></div>
        </section>
      )}
      {data!.artifact?.reviewed_at && <p className="text-sm text-slate-400">Direview {fmtDate(data!.artifact.reviewed_at)}{data!.artifact.review_note ? ` — “${data!.artifact.review_note}”` : ''}</p>}

      <section className="card" aria-labelledby="exec-heading">
        <h2 id="exec-heading" className="mb-3 font-medium text-white">Jejak eksekusi</h2>
        <ol className="space-y-2 text-sm">{data!.executions.map((e, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2"><span className="w-24 font-mono text-slate-400">{e.step}</span><Badge value={e.status} />{e.provider_id && <span className="text-slate-400">{e.provider_id}</span>}<code className="text-xs text-slate-500">{JSON.stringify(e.detail)}</code></li>
        ))}</ol>
        <button className="btn-ghost mt-4" onClick={() => setShowContract(!showContract)}>{showContract ? 'Sembunyikan' : 'Lihat'} kontrak tugas</button>
        {showContract && <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">{JSON.stringify(t.contract, null, 2)}</pre>}
      </section>

      <section className="card" aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="mb-3 font-medium text-white">Provenance bukti ({data!.evidence.length})</h2>
        <ul className="space-y-2 text-sm">{data!.evidence.map((e) => (
          <li key={e.id} className="border-b border-slate-800 pb-2"><SafeLink url={e.url}>{e.title}</SafeLink> <Badge value={e.evidence_class} /> <span className="text-xs text-slate-500">via {e.provider_id} · {e.trust} · {fmtDate(e.retrieved_at)}</span></li>
        ))}</ul>
      </section>
    </div>
  )
}
