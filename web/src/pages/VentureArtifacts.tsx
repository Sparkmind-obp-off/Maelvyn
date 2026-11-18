import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge, ErrorBox, fmtDate, Loading, PageHeader } from '../components/ui'
import { ApiRequestError } from '../lib/api'
import { useEnv, useLoad } from '../lib/hooks'

type Artifact = { id: string; filename: string; content_type: string; size_bytes: number; sha256: string; created_at: string }
type Resp = { artifacts: Artifact[] }

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.json'
const MAX_BYTES = 10 * 1024 * 1024

function humanSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/** Private venture artifacts (R2). Bytes are only ever served by the API after an authorization check. */
export default function VentureArtifacts() {
  const { vid } = useParams()
  const { environment } = useEnv()
  const { data, error, loading, api, reload } = useLoad((a) => a.get<Resp>(`/ventures/${vid}/artifacts`), [vid])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<ApiRequestError | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setErr(null); setNote(null)
    if (file.size > MAX_BYTES) { setNote('Berkas melebihi batas 10 MB.'); return }
    setBusy(true)
    try {
      await api.upload<{ artifact: Artifact }>(`/ventures/${vid}/artifacts`, file)
      setNote(`"${file.name}" diunggah.`)
      if (input.current) input.current.value = ''
      await reload()
    } catch (e) { setErr(e as ApiRequestError) } finally { setBusy(false) }
  }

  async function save(a: Artifact) {
    setErr(null)
    try { await api.download(`/artifacts/${a.id}/content`, a.filename) }
    catch (e) { setErr(e as ApiRequestError) }
  }

  async function remove(a: Artifact) {
    setErr(null); setNote(null)
    if (!window.confirm(`Hapus "${a.filename}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setBusy(true)
    try { await api.del(`/artifacts/${a.id}`); setNote(`"${a.filename}" dihapus.`); await reload() }
    catch (e) { setErr(e as ApiRequestError) } finally { setBusy(false) }
  }

  if (loading && !data) return <Loading />
  if (error) return <ErrorBox error={error} />

  return (
    <div>
      <PageHeader
        title="Artefak Privat"
        subtitle={<>Penyimpanan objek privat (R2). Setiap unggahan, unduhan, dan penghapusan tercatat di audit. Batas 10 MB · PDF, PNG, JPEG, WebP, TXT, CSV, JSON.</>}
      />

      {environment !== 'production' && (
        <p className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-200">
          Lingkungan <strong>{environment}</strong> — jangan unggah dokumen rahasia sungguhan di sini.
        </p>
      )}

      <form
        className="card mb-8 space-y-3"
        aria-labelledby="upload-heading"
        onSubmit={(e) => { e.preventDefault(); const f = input.current?.files?.[0]; if (f) void upload(f) }}
      >
        <h2 id="upload-heading" className="font-medium text-white">Unggah berkas</h2>
        <input
          ref={input}
          id="artifact-file"
          type="file"
          accept={ACCEPT}
          className="input"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f) }}
        />
        <ErrorBox error={err} />
        {note && <p role="status" className="text-sm text-emerald-300">{note}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Memproses…' : 'Unggah'}</button>
      </form>

      <section aria-labelledby="artifact-list-heading">
        <h2 id="artifact-list-heading" className="mb-3 text-lg font-semibold text-white">Berkas aktif</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Ukuran</th>
                <th className="p-3">Diupload</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(data!.artifacts ?? []).map((a) => (
                <tr key={a.id} className="border-t border-slate-800">
                  <td className="p-3">
                    <span className="text-slate-200">{a.filename}</span>
                    <span className="mt-1 block font-mono text-[10px] text-slate-500" title="SHA-256">sha256 {a.sha256.slice(0, 16)}…</span>
                  </td>
                  <td className="p-3"><Badge value={a.content_type} /></td>
                  <td className="p-3 text-slate-300">{humanSize(a.size_bytes)}</td>
                  <td className="p-3 text-slate-400">{fmtDate(a.created_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button type="button" className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800" onClick={() => void save(a)}>Unduh</button>
                      <button type="button" className="rounded-md border border-rose-900 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/60" disabled={busy} onClick={() => void remove(a)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data!.artifacts ?? []).length === 0 && (
                <tr><td colSpan={5} className="p-3 text-slate-500">Belum ada berkas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
