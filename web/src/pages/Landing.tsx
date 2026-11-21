import { Show, SignInButton } from '@clerk/react'
import { Link } from 'react-router-dom'

const PILLARS = [
  { t: 'Venture Studio', d: 'Menemukan masalah, menguji permintaan pasar, membentuk venture, lalu mengawasi kinerjanya dengan keputusan berbasis bukti.' },
  { t: 'Product & Service Factory', d: 'Mengubah kemampuan yang dapat diulang menjadi produk, software, layanan terpaket, dan aset digital yang bisa dijual.' },
  { t: 'Shared Operating System', d: 'Menghubungkan manusia, agent, workflow, provider, QA, data, dan keuangan melalui kontrak tugas serta batas kewenangan.' },
  { t: 'Governance & Portfolio', d: 'Menjaga keputusan, anggaran, hak, kepemilikan, kontribusi, risiko, dan kinerja setiap venture tetap dapat ditelusuri.' },
]

const BUSINESS_LINES = [
  { t: 'Build & operate ventures', d: 'Validasi peluang, pembentukan venture, operasi bersama, dan pengembangan portofolio.' },
  { t: 'Sell products & services', d: 'Produk digital, software, otomasi, produksi terpaket, dan layanan operasional dengan ruang lingkup yang jelas.' },
  { t: 'Commercialize assets', d: 'Lisensi, distribusi, dan pemanfaatan aset hanya berdasarkan hak dan perjanjian yang terdokumentasi.' },
]

const SAFEGUARDS = [
  'Pelanggan, venture, dan workspace internal memiliki batas data yang berbeda.',
  'Kontribusi, pembayaran jasa, pinjaman, lisensi, dan kepemilikan adalah hal yang berbeda.',
  'Agent tidak menyetujui pekerjaannya sendiri atau memperluas izinnya sendiri.',
  'Pengeluaran provider berbayar memerlukan anggaran, batas biaya, dan persetujuan.',
  'Publikasi, transaksi, dan tindakan eksternal memerlukan izin yang sesuai.',
  'Aset dan deliverable hanya dikirim setelah pemeriksaan hak, QA, dan persetujuan.',
]

export default function Landing() {
  return (
    <div className="space-y-14">
      <section id="hero-section" className="py-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-sky-400">Building Businesses. Creating Assets. Growing Together.</p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Kami membangun dan mengoperasikan bisnis—dengan sistem yang membuat setiap keputusan dapat dipertanggungjawabkan.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
          MAELVYN adalah Agentic Shared Venture Studio: venture studio dan product factory yang mengembangkan peluang menjadi venture, produk, layanan, serta aset produktif. MAELVYN OS menjadi mesin operasionalnya; pelanggan, produk, penjualan, pemenuhan, dan kesehatan bisnis tetap menjadi ukuran keberhasilan.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Participation by Choice. Ownership by Agreement. Tidak ada kepemilikan, imbal hasil, atau kemitraan yang timbul secara otomatis hanya karena seseorang berpartisipasi atau berkontribusi.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Show when="signed-in"><Link to="/workspaces" className="btn-primary">Buka MAELVYN OS</Link></Show>
          <Show when="signed-out"><SignInButton mode="modal"><button className="btn-primary">Masuk ke ruang kerja</button></SignInButton></Show>
          <a className="btn-ghost" href="https://github.com/Sparkmind-obp-Off/Maelvyn" target="_blank" rel="noreferrer noopener">Lihat prinsip dan dokumentasi</a>
        </div>
      </section>

      <section aria-labelledby="model-heading">
        <div className="mb-5 max-w-2xl">
          <h2 id="model-heading" className="text-xl font-semibold text-white">Satu studio. Dua mesin bisnis. Satu tata kelola.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Studio membangun portofolio venture. Factory menghasilkan produk dan layanan yang dapat dikomersialkan. Operating system menghubungkan keduanya tanpa mencampur hak, data, atau pembukuannya.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <article key={p.t} className="card"><h3 className="font-medium text-white">{p.t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{p.d}</p></article>
          ))}
        </div>
      </section>

      <section aria-labelledby="business-heading">
        <h2 id="business-heading" className="mb-4 text-xl font-semibold text-white">Cara nilai bisnis diciptakan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {BUSINESS_LINES.map((p) => (
            <article key={p.t} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"><h3 className="font-medium text-white">{p.t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{p.d}</p></article>
          ))}
        </div>
      </section>

      <section aria-labelledby="safeguards-heading" className="card">
        <h2 id="safeguards-heading" className="mb-3 text-xl font-semibold text-white">Governance yang menjaga bisnis tetap sehat</h2>
        <ul className="grid gap-3 text-sm leading-6 text-slate-300 sm:grid-cols-2">
          {SAFEGUARDS.map((s) => <li key={s} className="flex gap-2"><span aria-hidden className="text-sky-400">✓</span><span>{s}</span></li>)}
        </ul>
      </section>

      <section className="border-t border-slate-800 pt-6">
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          MAELVYN membedakan rancangan, eksperimen, pilot, dan operasi yang telah terverifikasi. Setiap produk, venture, integrasi, dan klaim komersial harus melewati validasi, pemeriksaan hak, kesiapan operasional, serta persetujuan yang relevan sebelum dinyatakan live.
        </p>
      </section>
    </div>
  )
}
