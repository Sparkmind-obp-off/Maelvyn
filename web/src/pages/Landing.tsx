import { Show, SignInButton } from '@clerk/react'
import { Link } from 'react-router-dom'

const LOOP = [
  { n: '01', t: 'Discover', d: 'Mulai dari konteks, masalah, dan pertanyaan yang layak dijawab.' },
  { n: '02', t: 'Make evidence', d: 'Susun riset, provenance, dan batas asumsi sebelum keputusan dibuat.' },
  { n: '03', t: 'Review together', d: 'Bawa pilihan penting kembali ke manusia yang bertanggung jawab.' },
  { n: '04', t: 'Operate clearly', d: 'Jaga scope, budget, memori, dan hak setiap venture tetap terbaca.' },
]

const PRINCIPLES = [
  ['01', 'Clarity before velocity', 'Setiap langkah punya tujuan, pemilik, dan bukti yang dapat ditinjau.'],
  ['02', 'Independence by design', 'Venture memiliki scope, data, IP, dan operasi sendiri; koordinasi tidak menghapus batas.'],
  ['03', 'Human review at the edge', 'Agen membantu menyiapkan pekerjaan. Persetujuan dan keputusan consequential tetap manusia.'],
]

export default function Landing() {
  return (
    <div className="landing">
      <section id="hero-section" className="mv-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">MAELVYN / VENTURE STUDIO &amp; COMMERCE ECOSYSTEM</p>
          <h1 id="hero-title">Building ventures with <span>clarity, evidence, and room to grow.</span></h1>
          <p className="hero-lede">MAELVYN menghubungkan discovery, validation, execution, dan shared operating infrastructure tanpa menghapus kemandirian setiap venture.</p>
          <div className="hero-actions">
            <Show when="signed-in"><Link to="/workspaces" className="btn-primary">Buka workspace <span aria-hidden>↗</span></Link></Show>
            <Show when="signed-out"><SignInButton mode="modal"><button className="btn-primary">Masuk ke workspace <span aria-hidden>↗</span></button></SignInButton></Show>
            <a className="btn-ghost" href="https://github.com/Sparkmind-obp-off/Maelvyn" target="_blank" rel="noreferrer noopener">Baca dokumentasi</a>
          </div>
          <p className="hero-footnote"><span className="status-dot" aria-hidden /> Readiness is explicit. Boundaries are part of the product.</p>
        </div>
        <aside className="hero-panel" aria-label="MAELVYN operating loop">
          <div className="panel-kicker">THE OPERATING LOOP</div>
          <p className="panel-title">Work moves forward when the next decision is clear.</p>
          <div className="loop-list">
            {LOOP.map((item) => <div key={item.n} className="loop-item"><span className="index-label">{item.n}</span><div><h2>{item.t}</h2><p>{item.d}</p></div></div>)}
          </div>
        </aside>
      </section>

      <section id="about" className="narrative-section" aria-labelledby="about-title">
        <div className="section-intro"><p className="eyebrow">01 / ABOUT</p><h2 id="about-title">A studio for the work between idea and operation.</h2></div>
        <div className="section-body"><p>MAELVYN adalah operating layer untuk venture work yang membutuhkan konteks bersama, koordinasi lintas fungsi, dan keputusan yang dapat ditelusuri.</p><p>Ini bukan holding company, investment marketplace, payment institution, atau janji pendanaan otomatis. Ecosystem berarti ruang koordinasi dan commerce yang lebih terstruktur—bukan kepemilikan yang diasumsikan.</p></div>
      </section>

      <section id="how-we-work" className="narrative-section narrative-section--split" aria-labelledby="work-title">
        <div className="section-intro"><p className="eyebrow">02 / HOW WE WORK</p><h2 id="work-title">A shared method, not a shortcut.</h2></div>
        <div className="principles-grid">{PRINCIPLES.map(([n, title, detail]) => <article key={n} className="principle-card"><span className="index-label">{n}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
      </section>

      <section id="boundaries" className="boundary-panel" aria-labelledby="boundary-title">
        <div><p className="eyebrow">03 / BOUNDARIES</p><h2 id="boundary-title">Coordination without silent ownership.</h2></div>
        <div className="boundary-copy"><p>Venture boundaries are explicit. Ownership, IP, data, finances, operating rights, and external commitments remain governed by the agreements and people responsible for them.</p><ul><li>Cross-venture access is denied by default.</li><li>Agent permissions are scoped and auditable.</li><li>Paid provider execution stays off until an approved budget and allowlist exist.</li><li>Important decisions return to human review.</li></ul></div>
      </section>

      <section id="connect" className="connect-section" aria-labelledby="connect-title">
        <div className="connect-copy"><p className="eyebrow">04 / MAELVYN CONNECT</p><h2 id="connect-title">A private bridge for the systems that do the work.</h2><p>MAELVYN Connect exposes scoped registries through an authenticated REST API and a local MCP bridge. Read is the default. Write requests become auditable proposals for human review; they do not mutate task state automatically.</p><a className="text-link" href="https://github.com/Sparkmind-obp-off/Maelvyn/blob/main/docs/MAELVYN-CONNECT.md" target="_blank" rel="noreferrer noopener">See the Connect contract <span aria-hidden>↗</span></a></div>
        <div className="connect-spec" aria-label="Connect safeguards"><div><span className="spec-label">DEFAULT</span><strong>Read-only</strong></div><div><span className="spec-label">SCOPE</span><strong>Workspace + venture</strong></div><div><span className="spec-label">WRITE</span><strong>Proposal + audit</strong></div><div><span className="spec-label">STATUS</span><strong>Not externally connected</strong></div></div>
      </section>

      <section className="closing-cta" aria-labelledby="cta-title"><p className="eyebrow">NEXT, WITH INTENT</p><h2 id="cta-title">Bring the next venture question into focus.</h2><p>Start inside the workspace, or read the operating documents before deciding what should happen next.</p><div className="hero-actions"><Show when="signed-in"><Link to="/workspaces" className="btn-primary">Buka workspace</Link></Show><Show when="signed-out"><SignInButton mode="modal"><button className="btn-primary">Masuk untuk mulai</button></SignInButton></Show><a className="btn-ghost" href="https://github.com/Sparkmind-obp-off/Maelvyn" target="_blank" rel="noreferrer noopener">Repository &amp; docs</a></div></section>
    </div>
  )
}
