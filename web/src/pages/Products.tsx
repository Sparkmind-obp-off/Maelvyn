import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, PageHeader } from '../components/ui'

type Product = {
  slug: string
  code: string
  name: string
  stage: number
  state: string
  audience: string
  problem: string
  outcome: string
  features: string[]
  workflow: string[]
  deliverables: string[]
  dependencies: string[]
  availability: string
  providers: string[]
  searchText: string
}

type RoadmapStage = { number: number; name: string; products: string; purpose: string; gate: string }

const STAGES: RoadmapStage[] = [
  { number: 1, name: 'Intelligence Products', products: 'SIGNAL + LEADINTEL', purpose: 'Riset pasar dan intelijen perusahaan yang ditopang sumber, provenance, klasifikasi bukti, serta hal yang belum diketahui.', gate: 'Sumber publik/berizin, provenance, batas kuota/biaya, dan human review.' },
  { number: 2, name: 'Workflow Products', products: 'FLOW', purpose: 'Operasi pelanggan dan pipeline dalam akun yang dimiliki dan diotorisasi pelanggan.', gate: 'BYOC, scope minimum, draft-before-send, persetujuan untuk write, serta revokasi.' },
  { number: 3, name: 'Content & Commerce', products: 'REACH + COMMERCE', purpose: 'Alur konten dan operasi toko setelah hak media, akun toko, payment, serta permission publishing diverifikasi.', gate: 'Review aset, persetujuan publish/send, idempotensi transaksi, rekonsiliasi, dan approval finansial.' },
  { number: 4, name: 'Agentic Workforce', products: 'AGENTIC WORKFORCE', purpose: 'Orkestrasi tugas dengan memory berscope, kontrak tugas, evaluasi, allowlist, dan pengawasan manusia.', gate: 'Runtime, izin, compute, batas otonomi, audit, dan kill switch harus diverifikasi.' },
  { number: 5, name: 'Product Marketplace', products: 'PRODUCT MARKETPLACE', purpose: 'Pelanggan memilih hasil, paket, kapasitas, dan workflow yang disediakan MAELVYN.', gate: 'Produk teruji, unit economics dan ketentuan layanan ditinjau; tidak menjual akses API mentah.' },
]

const PRODUCTS: Product[] = [
  {
    slug: 'signal', code: 'SIGNAL', name: 'Market Intelligence', stage: 1, state: 'INTERNAL_DRAFT',
    audience: 'Founder, pemilik brand, product manager, seller, dan venture builder.',
    problem: 'Sinyal pasar, kompetitor, kategori, tren, dan harga tersebar; hipotesis sering tercampur dengan fakta.',
    outcome: 'Brief peluang pasar dengan sumber, konteks, confidence, risiko, dan pertanyaan terbuka yang bisa ditinjau.',
    features: ['Market, kategori, dan competitor landscape', 'Trend, harga, dan demand signals', 'Opportunity hypotheses dengan source ledger', 'Pemisahan reported facts, inference, dan unknowns'],
    workflow: ['Tetapkan pertanyaan dan tujuan', 'Kumpulkan sumber yang diizinkan', 'Normalisasi temuan dan provenance', 'Human review sebelum keputusan', 'Kirim brief dan evidence ledger'],
    deliverables: ['Market opportunity brief', 'Competitor & pricing map', 'Sourced evidence ledger'],
    dependencies: ['Provider route yang diizinkan oleh Execution Gateway', 'URL, provider, waktu retrieval dan klasifikasi bukti', 'Quota, budget guard, terms dan data handling diverifikasi'],
    availability: 'Research workflow MAELVYN tersedia di workspace sesuai role dan policy environment. Status ini bukan klaim bahwa provider atau komersialisasi telah disetujui.',
    providers: ['Firecrawl', 'Tavily Search / Extract', 'DataForSEO'],
    searchText: 'market intelligence competitor category trends pricing opportunity research evidence',
  },
  {
    slug: 'leadintel', code: 'LEADINTEL', name: 'Sourced Business Intelligence', stage: 1, state: 'DISCOVERY',
    audience: 'Tim business development, venture, kemitraan, dan riset perusahaan.',
    problem: 'Riset perusahaan, prospek bisnis, dan partner tidak konsisten serta sulit ditelusuri sumber dan alasannya.',
    outcome: 'Shortlist perusahaan/partner berbasis sumber dengan kriteria kualifikasi, segmentasi, confidence, dan unknowns.',
    features: ['Riset perusahaan, prospek bisnis, dan partner', 'Evidence-backed qualification rubric', 'Segmentasi berdasarkan kriteria bisnis yang ditetapkan', 'Source provenance dan timestamp pada setiap record'],
    workflow: ['Tetapkan tujuan dan penggunaan yang sah', 'Pilih field bisnis publik/berizin', 'Kumpulkan dan catat sumber', 'Kualifikasi dengan evidence', 'Human review sebelum ekspor atau tindak lanjut'],
    deliverables: ['Company research cards', 'Qualification matrix', 'Sourced business shortlist'],
    dependencies: ['Sumber publik atau penggunaan yang diotorisasi', 'Rights, coverage, akurasi, dan purpose review', 'Tidak ada private-data inference, sensitive personal profiling, atau outreach'],
    availability: 'Discovery; tidak melakukan inferensi data pribadi privat, sensitive profiling, atau outreach. Tidak ada klaim integrasi AgentData.',
    providers: ['AgentData (kandidat; belum terikat)', 'Tavily (sesuai route dan policy yang tersedia)'],
    searchText: 'company prospect partner lead segmentation qualification sourced business no private data inference outreach',
  },
  {
    slug: 'flow', code: 'FLOW', name: 'Customer Operations Workflow', stage: 2, state: 'PLANNED',
    audience: 'MSME, bisnis jasa, tim sales, dan operator venture.',
    problem: 'Pipeline, konteks pelanggan, follow-up, dan next steps tersimpan di banyak sistem.',
    outcome: 'Alur operasi pelanggan yang terkoordinasi dalam workspace dan akun milik customer.',
    features: ['Pipeline dan customer history', 'Follow-up, reminder, scheduling', 'Draft alur email/messaging', 'Reporting penggunaan dan aktivitas tim'],
    workflow: ['Hubungkan akun customer melalui BYOC', 'Tinjau owner, scopes, dan purpose', 'Siapkan rencana atau draft', 'Minta approval untuk write/send', 'Eksekusi terbatas melalui gateway dan audit'],
    deliverables: ['Pipeline board', 'Follow-up queue', 'Customer history dan report'],
    dependencies: ['Explicit authorization dan account ownership', 'Verified OAuth scopes serta pemisahan read/write', 'Idempotency, audit, approval dan revocation'],
    availability: 'Roadmap; tidak ada koneksi akun customer atau pengiriman pesan yang diaktifkan oleh katalog ini.',
    providers: ['Composio (terms review)', 'Nango (candidate)', 'Make (candidate)'],
    searchText: 'CRM customer pipeline follow-up reminders scheduling email messaging BYOC',
  },
  {
    slug: 'reach', code: 'REACH', name: 'Content & Publishing Workflow', stage: 3, state: 'GATED',
    audience: 'Creator, affiliate, brand, dan tim marketing.',
    problem: 'Riset konten, approval kreatif, distribusi, serta pelaporan tidak memiliki satu evidence trail.',
    outcome: 'Operasi konten dari brief berbasis riset hingga distribusi yang disetujui dan pelaporan.',
    features: ['Riset konten, kategori, dan kompetitor', 'Strategi, brief, dan kalender konten', 'Human creative review dan revisi', 'Publishing queue dan performance report'],
    workflow: ['Riset', 'Tulis brief/draft', 'Tinjau hak aset dan provenance', 'Minta approval manusia', 'Publish hanya setelah permission terverifikasi'],
    deliverables: ['Content plan', 'Creative brief', 'Approval/publishing queue', 'Performance report'],
    dependencies: ['Media rights dan provenance', 'Akun, scope, consent, dan platform permission', 'Human publish/send approval serta rollback/disable control'],
    availability: 'Gated; publishing, distribusi publik, dan outbound messaging tidak diaktifkan.',
    providers: ['Firecrawl / Tavily untuk riset hanya bila diizinkan', 'Composio atau platform APIs sebagai kandidat, belum disetujui'],
    searchText: 'content research strategy briefs approval publishing queue performance media rights',
  },
  {
    slug: 'commerce', code: 'COMMERCE', name: 'Commerce Operations', stage: 3, state: 'GATED',
    audience: 'Online seller, brand, dan operator commerce.',
    problem: 'Catalog, order, stok, rekonsiliasi pembayaran, dan fulfillment perlu kontrol yang konsisten.',
    outcome: 'Workflow scoped untuk visibilitas catalog/order dan operasi commerce yang dapat diaudit.',
    features: ['Catalog dan order visibility', 'Inventory monitoring', 'Payment reconciliation status', 'Fulfillment queue dan laporan penjualan'],
    workflow: ['Verifikasi seller dan account owner', 'Otorisasi scopes BYOC', 'Baca catalog/order sesuai izin', 'Tampilkan proposed writes', 'Minta human finance approval dan verifikasi hasil'],
    deliverables: ['Order dashboard', 'Inventory alerts', 'Reconciliation report', 'Fulfillment view'],
    dependencies: ['Store/payment permission terverifikasi', 'Idempotency, audit dan rekonsiliasi', 'Tidak ada payment processing atau money movement tanpa approval'],
    availability: 'Gated; tidak memproses pembayaran, mengubah toko, memindahkan uang, atau memenuhi pesanan.',
    providers: ['Shopify dan provider pembayaran/logistik hanya kandidat hingga terms dan permission diverifikasi'],
    searchText: 'commerce catalog orders inventory payment reconciliation fulfillment transaction money',
  },
  {
    slug: 'agentic-workforce', code: 'AGENTIC WORKFORCE', name: 'Governed Agent Workforce', stage: 4, state: 'CANDIDATE',
    audience: 'Operator venture dan workspace MAELVYN.',
    problem: 'Otonomi tanpa task scope, policy, evaluasi, dan kontrol manusia menimbulkan risiko operasional.',
    outcome: 'Agent yang menyiapkan dan menjalankan tugas terbatas hanya dalam kontrak serta izin yang berlaku.',
    features: ['Agent registry dan scoped memory', 'Orchestration, plan, dan task contract', 'Allowlisted tools via Execution Gateway', 'Evaluation, cost/usage dan failure signals', 'Human oversight, approval, dan kill switch'],
    workflow: ['Tetapkan objective', 'Buat bounded plan', 'Periksa policy, permissions, dan budget', 'Minta review saat dibutuhkan', 'Jalankan scope terbatas lalu evaluasi/audit'],
    deliverables: ['Plan dan run record', 'Evaluation summary', 'Evidence serta audit events'],
    dependencies: ['Runtime/permission/compute terverifikasi', 'Gateway, idempotency, dan redaction', 'Agent tidak menyetujui aksi sendiri'],
    availability: 'Candidate stage; modul agent/task yang ada tidak membuktikan runtime atau autonomous execution telah disetujui.',
    providers: ['Agent Relay', 'Agent Swarm', 'Manus atau runtime lain (belum diverifikasi)'],
    searchText: 'agent workforce orchestration scoped memory task contract runtime compute evaluation oversight',
  },
  {
    slug: 'product-marketplace', code: 'PRODUCT MARKETPLACE', name: 'Outcome & Workflow Marketplace', stage: 5, state: 'CONCEPT',
    audience: 'Customer yang memilih solusi untuk pekerjaan dan hasil yang jelas.',
    problem: 'Customer membutuhkan hasil dan batas layanan yang terang, bukan tumpukan API vendor.',
    outcome: 'Permukaan pemilihan paket MAELVYN berdasarkan outcome, workflow, dan kapasitas yang dibatasi.',
    features: ['Outcome-oriented catalog', 'Pilihan package, capacity, dan workflow', 'Scope, entitlement, dan batas layanan transparan', 'Milestone serta delivery evidence'],
    workflow: ['Pilih outcome', 'Tinjau scope dan harga yang kelak diverifikasi', 'Otorisasi workspace', 'Setujui bounded work', 'Terima delivery berdasarkan kriteria'],
    deliverables: ['Deskripsi paket MAELVYN', 'Scope/capacity dan milestone', 'Delivery records dan acceptance evidence'],
    dependencies: ['Produk telah teruji dan dapat didukung', 'Unit economics, privacy, terms, dan legal review', 'Tidak menjual raw third-party API access'],
    availability: 'Concept; tidak ada checkout, transaksi, atau harga jual aktif.',
    providers: [],
    searchText: 'marketplace package capacity workflows outcome no raw API resale',
  },
]

const CORE_LAYERS = [
  ['01', 'Intelligence & Evidence', 'Sumber, provenance, dan analisis yang dapat ditinjau.'],
  ['02', 'Execution & Control', 'Identity, tenant, permissions, policy, approvals, budget, audit.'],
  ['03', 'Design & Product Factory', 'Mengubah evidence menjadi definisi produk dan delivery.'],
  ['04', 'Creative & Content Factory', 'Membuat, meninjau, dan mengelola aset dengan hak yang jelas.'],
  ['05', 'Integration & Automation', 'Provider adapters, BYOC, dan workflow melalui gateway.'],
]

const SOURCE_DOCS = [
  ['Capability integration architecture', 'EXTERNAL-CAPABILITY-INTEGRATION-ARCHITECTURE.md'],
  ['Provider binding register', 'EXTERNAL-PROVIDER-BINDING-REGISTER.md'],
  ['Free-first discovery', 'FREE-FIRST-PROVIDER-DISCOVERY-INTELLIGENCE.md'],
  ['Internal system & product catalog', 'MAELVYN-INTERNAL-SYSTEM-AND-EXTERNAL-PRODUCT-CATALOG.md'],
]

function ProductCard({ product }: { product: Product }) {
  const stage = STAGES[product.stage - 1]
  return (
    <Link to={`/products/${product.slug}`} className="card group flex h-full flex-col transition hover:-translate-y-0.5 hover:border-cyan-500/60 focus-visible:outline-offset-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-semibold tracking-[.16em] text-cyan-300">{product.code}</span>
        <Badge value={product.state} />
      </div>
      <p className="mt-5 text-xs uppercase tracking-[.12em] text-slate-500">Stage 0{product.stage} · {stage?.name ?? 'Stage tidak ditetapkan'}</p>
      <h2 className="mt-2 text-xl font-semibold text-white group-hover:text-cyan-100">{product.name}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{product.outcome}</p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
        <span>{product.audience}</span><span aria-hidden="true" className="text-cyan-300">Detail →</span>
      </div>
    </Link>
  )
}

export default function ProductsPage() {
  const { slug } = useParams()
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const selected = PRODUCTS.find((product) => product.slug === slug)
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('id-ID')
    return PRODUCTS.filter((product) => {
      const matchesStage = stageFilter === 'all' || String(product.stage) === stageFilter
      const searchable = `${product.code} ${product.name} ${product.audience} ${product.problem} ${product.outcome} ${product.features.join(' ')} ${product.providers.join(' ')} ${product.searchText}`.toLocaleLowerCase('id-ID')
      return matchesStage && (!q || searchable.includes(q))
    })
  }, [query, stageFilter])

  if (slug && !selected) return (
    <div className="space-y-4">
      <PageHeader title="Produk tidak ditemukan" subtitle="Produk tersebut tidak tercantum pada katalog MAELVYN." />
      <Link to="/products" className="btn-ghost">← Kembali ke katalog</Link>
    </div>
  )

  if (selected) return <ProductDetail product={selected} />

  return (
    <div className="space-y-12 pb-8">
      <header className="grid gap-8 border-b border-slate-800 pb-8 md:grid-cols-[1.15fr_.85fr] md:items-end">
        <div>
          <p className="eyebrow">PRODUCT ENGINE · MAELVYN</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">Produk yang membawa kerja dari evidence menuju operasi.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">MAELVYN adalah Venture Studio &amp; Commerce Ecosystem dengan shared operating infrastructure. Kami productize outcome dan workflow—bukan menjual akses mentah ke provider.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/workspaces" className="btn-primary">Buka workspace <span aria-hidden="true">↗</span></Link>
            <a href="https://github.com/Sparkmind-obp-off/Maelvyn/tree/main/docs" target="_blank" rel="noreferrer noopener" className="btn-ghost">Dokumentasi operating model</a>
          </div>
        </div>
        <aside className="border-l-2 border-cyan-500 pl-5 md:ml-auto md:max-w-md">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-cyan-300">Product readiness, stated honestly</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">Catalog metadata describes MAELVYN product intent. It is not an entitlement or a claim of provider connectivity, commercial clearance, production readiness, or available capacity. Actual workspace access and execution remain controlled by server-side policy.</p>
        </aside>
      </header>

      <section aria-labelledby="roadmap-title" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">CUSTOMER PRODUCTIZATION ROADMAP</p><h2 id="roadmap-title" className="mt-2 text-2xl font-semibold text-white">Five stages. One accountable control plane.</h2></div>
          <p className="max-w-xl text-sm text-slate-400">Roadmap produk ini berbeda dari lima capability layers internal. Core dan Owner Control adalah fondasi; bukan produk atau stage tambahan.</p>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 md:grid-cols-5">
          {STAGES.map((stage) => (
            <li key={stage.number} className="bg-[#0b2847] p-4 sm:p-5">
              <span className="font-mono text-xs text-cyan-300">0{stage.number} / 05</span>
              <h3 className="mt-3 min-h-12 text-base font-semibold text-white">{stage.name}</h3>
              <p className="mt-2 min-h-10 text-xs font-semibold tracking-wide text-cyan-100">{stage.products}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{stage.purpose}</p>
              <p className="mt-4 border-t border-slate-700 pt-3 text-xs leading-5 text-slate-400"><strong className="text-slate-200">Gate:</strong> {stage.gate}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="catalog-title" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">OUTCOME CATALOG</p><h2 id="catalog-title" className="mt-2 text-2xl font-semibold text-white">Product definitions</h2></div><p className="text-sm text-slate-400">{filtered.length} dari {PRODUCTS.length} produk</p></div>
        <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-[1fr_15rem]">
          <div><label htmlFor="product-search" className="label">Cari produk, outcome, fitur, provider</label><input id="product-search" type="search" className="input" placeholder="Contoh: market, pipeline, evidence…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div><label htmlFor="stage-filter" className="label">Filter stage</label><select id="stage-filter" className="input" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">Semua stage</option>{STAGES.map((stage) => <option key={stage.number} value={String(stage.number)}>Stage {stage.number} · {stage.name}</option>)}</select></div>
        </div>
        {filtered.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : (
          <div className="card text-center"><h3 className="font-semibold text-white">Tidak ada produk yang cocok</h3><p className="mt-2 text-sm text-slate-400">Ubah pencarian atau reset filter untuk melihat seluruh katalog.</p><button className="btn-ghost mt-4" onClick={() => { setQuery(''); setStageFilter('all') }}>Reset filter</button></div>
        )}
      </section>

      <section aria-labelledby="layers-title" className="space-y-5">
        <div><p className="eyebrow">INTERNAL OPERATING MODEL</p><h2 id="layers-title" className="mt-2 text-2xl font-semibold text-white">Core, control, agents, gateway.</h2></div>
        <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div className="card space-y-4">
            <div><p className="font-mono text-xs text-cyan-300">FOUNDATION</p><h3 className="mt-1 text-lg font-semibold text-white">MAELVYN Core + Owner Control</h3><p className="mt-2 text-sm leading-6 text-slate-300">Core owns identity, tenant boundaries, RBAC, policy, canonical business records, finance, rights, approvals, and audit/evidence. Owner Control governs privileged actions and release boundaries.</p></div>
            <div className="border-t border-slate-800 pt-4"><p className="font-mono text-xs text-cyan-300">ORCHESTRATION</p><h3 className="mt-1 text-lg font-semibold text-white">Agentic OS</h3><p className="mt-2 text-sm leading-6 text-slate-300">Agents, plans, scoped memory, task contracts, evaluation, and autonomy operate under policy. Agentic OS is not the canonical database and does not grant permission.</p></div>
            <div className="border-t border-slate-800 pt-4"><p className="font-mono text-xs text-cyan-300">ENFORCEMENT</p><h3 className="mt-1 text-lg font-semibold text-white">Execution Gateway</h3><p className="mt-2 text-sm leading-6 text-slate-300">Every future external execution must enforce allowlists, tenant/account routing, scopes, budget, approvals, idempotency, redaction, verification, and audit correlation. Agents do not call providers directly.</p></div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-2">
            {CORE_LAYERS.map(([number, title, detail]) => <article key={number} className="bg-[#0b2847] p-5"><span className="font-mono text-xs text-cyan-300">LAYER {number}</span><h3 className="mt-3 font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p></article>)}
          </div>
        </div>
      </section>

      <section aria-labelledby="boundaries-title" className="card space-y-5">
        <div><p className="eyebrow">TENANT & ACCOUNT BOUNDARIES</p><h2 id="boundaries-title" className="mt-2 text-2xl font-semibold text-white">Bring your own connection. Keep authority distinct.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Customer BYOC accounts are separate from MAELVYN-owned operating accounts. Credentials remain in secure server-side references and are never surfaced in this catalog.</p></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Customer', 'Organization / tenant boundary'], ['User', 'Authenticated human identity'], ['Workspace', 'Scoped operating area'],
            ['Agent', 'Non-human actor with bounded task authority'], ['Provider', 'External vendor identity'], ['Integration Account', 'Authorized connection with owner, scopes, and revocation'],
          ].map(([name, detail]) => <div key={name} className="border-t border-slate-700 py-3"><h3 className="font-semibold text-white">{name}</h3><p className="mt-1 text-sm text-slate-400">{detail}</p></div>)}
        </div>
        <p className="rounded-lg border border-amber-700/50 bg-amber-950/20 p-3 text-sm leading-6 text-amber-100">Human approval selalu diperlukan untuk money movement, kontrak/komitmen, perubahan ownership atau IP, publishing, outbound messages, deletion, serta tindakan irreversible. Paid capability, payment, publishing, dan external write tidak diaktifkan oleh halaman ini.</p>
      </section>

      <section aria-labelledby="sources-title" className="border-t border-slate-800 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">SOURCE OF TRUTH</p><h2 id="sources-title" className="mt-2 text-xl font-semibold text-white">Decision and provider references</h2></div><Link to="/" className="text-sm text-cyan-300 hover:underline">← Kembali ke MAELVYN</Link></div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SOURCE_DOCS.map(([label, file]) => <li key={file}><a className="text-sm text-cyan-200 hover:underline" href={`https://github.com/Sparkmind-obp-off/Maelvyn/blob/main/docs/${file}`} target="_blank" rel="noreferrer noopener">{label} ↗</a></li>)}
        </ul>
      </section>
    </div>
  )
}

function ProductDetail({ product }: { product: Product }) {
  const stage = STAGES[product.stage - 1]
  return (
    <div className="space-y-7 pb-8">
      <div><Link to="/products" className="text-sm text-cyan-300 hover:underline">← Semua produk</Link></div>
      <header className="grid gap-6 border-b border-slate-800 pb-7 md:grid-cols-[1fr_auto] md:items-end">
        <div><p className="eyebrow">STAGE 0{product.stage} · {stage?.name.toUpperCase() ?? 'STAGE TIDAK DITETAPKAN'}</p><p className="mt-3 font-mono text-sm tracking-[.18em] text-cyan-300">{product.code}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{product.name}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{product.outcome}</p></div>
        <div className="flex flex-wrap gap-2 md:justify-end"><Badge value={product.state} /><Link to="/workspaces" className="btn-primary">Workspace access ↗</Link></div>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card"><h2 className="label">Audience</h2><p className="text-sm leading-6 text-slate-200">{product.audience}</p></section>
        <section className="card"><h2 className="label">Problem</h2><p className="text-sm leading-6 text-slate-200">{product.problem}</p></section>
        <section className="card"><h2 className="label">Features</h2><ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">{product.features.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="card"><h2 className="label">Workflow</h2><ol className="mt-3 space-y-2 text-sm text-slate-300">{product.workflow.map((item, index) => <li key={item} className="flex gap-3"><span className="font-mono text-cyan-300">0{index + 1}</span><span>{item}</span></li>)}</ol></section>
        <section className="card"><h2 className="label">Deliverables</h2><ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">{product.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="card"><h2 className="label">Dependencies & gates</h2><ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-300">{product.dependencies.map((item) => <li key={item}>{item}</li>)}</ul></section>
      </div>
      <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-cyan-900/70 bg-cyan-950/20 p-5"><p className="label">Readiness</p><p className="mt-2"><Badge value={product.state} /></p><p className="mt-3 text-sm leading-6 text-slate-200">{product.availability}</p></div>
        <div className="card"><p className="label">Provider candidates · not a binding claim</p>{product.providers.length ? <ul className="mt-3 space-y-2 text-sm text-slate-300">{product.providers.map((provider) => <li key={provider} className="flex gap-2"><span aria-hidden="true" className="text-cyan-300">—</span>{provider}</li>)}</ul> : <p className="mt-3 text-sm text-slate-400">No provider candidates selected; the marketplace sells MAELVYN outcomes, not raw provider access.</p>}<p className="mt-4 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-400">Candidates do not imply account access, free quota, adapter binding, commercial clearance, or production approval. Check the provider register before any enablement.</p></div>
      </section>
      <section className="card flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold text-white">Execution remains workspace- and policy-scoped.</h2><p className="mt-1 text-sm text-slate-400">Katalog ini tidak membuat entitlement baru dan tidak melewati auth, approval, provider allowlist, budget guard, atau audit yang sudah ada.</p></div><Link to="/workspaces" className="btn-ghost">Masuk ke workspace</Link></section>
    </div>
  )
}
