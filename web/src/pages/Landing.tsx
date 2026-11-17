import { Show, SignInButton } from '@clerk/react'
import { Link } from 'react-router-dom'

const PILLARS = [
  { t: 'Shared Economic Core', d: 'Tata kelola, izin, kontrol keuangan, bukti, dan koordinasi portofolio.' },
  { t: 'Active Venture Studio', d: 'Discover → Research → Validate → Decide → Charter → Build → Launch → Operate.' },
  { t: 'Venture Portfolio', d: 'Setiap venture punya scope, anggaran, catatan, hak, dan risiko sendiri.' },
  { t: 'Agentic OS', d: 'Agen spesialis dengan izin terbatas, memori ber-scope, adapter provider, dan audit.' },
]

const SAFEGUARDS = [
  'Partisipasi sukarela & spesifik — diam bukan persetujuan',
  'Tidak ada pembagian kepemilikan default; kontribusi ≠ kepemilikan',
  'Agen tidak menyetujui pekerjaannya sendiri; keputusan tercadang wajib manusia',
  'Akses lintas-venture ditolak secara default',
  'Panggilan provider berbayar mati secara default, dengan batas kredit & kill switch',
]

export default function Landing() {
  return (
    <div className="space-y-12">
      <section id="hero-section" className="py-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-sky-400">Building Businesses. Creating Assets. Growing Together.</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Sistem operasi venture studio berbasis agen — dengan bukti, disiplin, dan batasan.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Fondasi pengembangan MAELVYN: workspace & venture ter-isolasi, Research Brief Agent (L2 Prepare) dengan provenance sumber,
          review manusia, registry provider & agen, anggaran kredit, dan audit append-only.
        </p>
        <div className="mt-6 flex gap-3">
          <Show when="signed-in"><Link to="/workspaces" className="btn-primary">Buka workspace</Link></Show>
          <Show when="signed-out"><SignInButton mode="modal"><button className="btn-primary">Masuk untuk mulai</button></SignInButton></Show>
          <a className="btn-ghost" href="https://github.com/Sparkmind-obp-off/Maelvyn" target="_blank" rel="noreferrer noopener">Dokumentasi</a>
        </div>
      </section>
      <section aria-labelledby="pillars-heading">
        <h2 id="pillars-heading" className="mb-4 text-lg font-semibold text-white">Model operasi</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <article key={p.t} className="card"><h3 className="font-medium text-white">{p.t}</h3><p className="mt-2 text-sm text-slate-400">{p.d}</p></article>
          ))}
        </div>
      </section>
      <section aria-labelledby="safeguards-heading" className="card">
        <h2 id="safeguards-heading" className="mb-3 text-lg font-semibold text-white">Safeguard yang ditegakkan di server</h2>
        <ul className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          {SAFEGUARDS.map((s) => <li key={s} className="flex gap-2"><span aria-hidden className="text-sky-400">✓</span>{s}</li>)}
        </ul>
      </section>
    </div>
  )
}
