import { Show, SignInButton, UserButton } from '@clerk/react'
import { EnvContext } from './lib/hooks'
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom'
import Landing from './pages/Landing'
import WorkspacesPage from './pages/Workspaces'
import WorkspacePage from './pages/Workspace'
import VenturePage from './pages/Venture'
import ResearchPage from './pages/Research'
import ProvidersPage from './pages/Providers'
import AgentsPage from './pages/Agents'
import AuditPage from './pages/Audit'
import MembersPage from './pages/Members'
import AcceptInvitePage from './pages/AcceptInvite'
import GovernancePage from './pages/Governance'
import PortfolioPage from './pages/Portfolio'
import PlatformPage from './pages/Platform'
import MePage from './pages/Me'
import ProductsPage from './pages/Products'
import VentureGovernance from './pages/VentureGovernance'
import VentureFinance from './pages/VentureFinance'
import VentureRights from './pages/VentureRights'
import VentureOps from './pages/VentureOps'
import VentureMemory from './pages/VentureMemory'
import VentureTeam from './pages/VentureTeam'
import VentureArtifacts from './pages/VentureArtifacts'

const tabClass = ({ isActive }: { isActive: boolean }) => `mv-tab ${isActive ? 'is-active' : ''}`

function WorkspaceNav() {
  const { wid } = useParams()
  if (!wid) return null
  return (
    <nav aria-label="Workspace" className="subnav mb-6">
      <NavLink end to={`/w/${wid}`} className={tabClass}>Ringkasan &amp; Venture</NavLink>
      <NavLink to={`/w/${wid}/portfolio`} className={tabClass}>Portofolio</NavLink>
      <NavLink to={`/w/${wid}/governance`} className={tabClass}>Governance</NavLink>
      <NavLink to={`/w/${wid}/members`} className={tabClass}>Anggota</NavLink>
      <NavLink to={`/w/${wid}/providers`} className={tabClass}>Provider &amp; Kill switch</NavLink>
      <NavLink to={`/w/${wid}/agents`} className={tabClass}>Registry Agen</NavLink>
      <NavLink to={`/w/${wid}/audit`} className={tabClass}>Audit</NavLink>
    </nav>
  )
}

function VentureNav() {
  const { wid, vid } = useParams()
  const base = `/w/${wid}/v/${vid}`
  return (
    <nav aria-label="Venture" className="subnav mb-6 subnav--venture">
      <NavLink end to={base} className={tabClass}>Riset</NavLink>
      <NavLink to={`${base}/governance`} className={tabClass}>Charter &amp; Lifecycle</NavLink>
      <NavLink to={`${base}/team`} className={tabClass}>Tim</NavLink>
      <NavLink to={`${base}/finance`} className={tabClass}>Keuangan</NavLink>
      <NavLink to={`${base}/rights`} className={tabClass}>Kontribusi &amp; Hak</NavLink>
      <NavLink to={`${base}/ops`} className={tabClass}>Operasi</NavLink>
      <NavLink to={`${base}/memory`} className={tabClass}>Memori</NavLink>
      <NavLink to={`${base}/artifacts`} className={tabClass}>Artefak</NavLink>
    </nav>
  )
}

function V({ children }: { children: React.ReactNode }) {
  return <Protected><WorkspaceNav /><VentureNav />{children}</Protected>
}

function WithNav({ children }: { children: React.ReactNode }) {
  return <><WorkspaceNav />{children}</>
}

export default function App({ environment, identityInstance, dataPolicy }: { environment: string; identityInstance: string; dataPolicy: string }) {
  return (
    <EnvContext.Provider value={{ environment, identityInstance, dataPolicy }}>
      <div className="min-h-screen">
        <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
        {environment !== 'production' && (
          <div role="note" className="env-banner">
            Lingkungan <strong>{environment}</strong> · identitas <strong>{identityInstance}</strong> · data <strong>{dataPolicy}</strong> — jangan masukkan data peserta, keuangan, atau rahasia nyata.
          </div>
        )}
        <header className="mv-header">
          <div className="mv-header__inner">
            <Link to="/" className="brand-lockup" aria-label="MAELVYN, home">
              <img src="/favicon.svg" alt="" className="brand-mark" />
              <span className="brand-wordmark">MAELVYN</span>
              <span className="brand-descriptor">Venture Studio &amp; Commerce Ecosystem</span>
            </Link>
            <nav aria-label="Public" className="public-nav">
              <Link to="/products">Produk</Link>
              <a href="/#about">About</a>
              <a href="/#how-we-work">How we work</a>
              <a href="/#boundaries">Boundaries</a>
              <a href="/#connect">Connect</a>
            </nav>
            <div className="header-actions">
              <Show when="signed-in">
                <Link to="/workspaces" className="header-link">Workspace</Link>
                <Link to="/me" className="header-link">Saya</Link>
                <UserButton />
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal"><button className="btn-primary">Masuk</button></SignInButton>
              </Show>
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductsPage />} />
            <Route path="/workspaces" element={<Protected><WorkspacesPage /></Protected>} />
            <Route path="/w/:wid" element={<Protected><WithNav><WorkspacePage /></WithNav></Protected>} />
            <Route path="/invite" element={<Protected><AcceptInvitePage /></Protected>} />
            <Route path="/w/:wid/members" element={<Protected><WithNav><MembersPage /></WithNav></Protected>} />
            <Route path="/w/:wid/providers" element={<Protected><WithNav><ProvidersPage /></WithNav></Protected>} />
            <Route path="/w/:wid/agents" element={<Protected><WithNav><AgentsPage /></WithNav></Protected>} />
            <Route path="/w/:wid/audit" element={<Protected><WithNav><AuditPage /></WithNav></Protected>} />
            <Route path="/me" element={<Protected><MePage /></Protected>} />
            <Route path="/platform" element={<Protected><PlatformPage /></Protected>} />
            <Route path="/w/:wid/portfolio" element={<Protected><WithNav><PortfolioPage /></WithNav></Protected>} />
            <Route path="/w/:wid/governance" element={<Protected><WithNav><GovernancePage /></WithNav></Protected>} />
            <Route path="/w/:wid/v/:vid" element={<V><VenturePage /></V>} />
            <Route path="/w/:wid/v/:vid/governance" element={<V><VentureGovernance /></V>} />
            <Route path="/w/:wid/v/:vid/team" element={<V><VentureTeam /></V>} />
            <Route path="/w/:wid/v/:vid/finance" element={<V><VentureFinance /></V>} />
            <Route path="/w/:wid/v/:vid/rights" element={<V><VentureRights /></V>} />
            <Route path="/w/:wid/v/:vid/ops" element={<V><VentureOps /></V>} />
            <Route path="/w/:wid/v/:vid/memory" element={<V><VentureMemory /></V>} />
            <Route path="/w/:wid/v/:vid/artifacts" element={<V><VentureArtifacts /></V>} />
            <Route path="/w/:wid/research/:tid" element={<Protected><WithNav><ResearchPage /></WithNav></Protected>} />
            <Route path="*" element={<p className="text-slate-400">Halaman tidak ditemukan.</p>} />
          </Routes>
        </main>
        <footer className="mv-footer">
          <div className="mv-footer__inner">
            <span className="brand-wordmark">MAELVYN</span>
            <span>Building Ventures. Creating Value. Growing Together.</span>
            <span>Participation by Choice. Ownership by Agreement.</span>
          </div>
        </footer>
      </div>
    </EnvContext.Provider>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <div className="card access-card mx-auto max-w-md text-center">
          <p className="mb-4 text-slate-300">Silakan masuk untuk mengakses workspace.</p>
          <SignInButton mode="modal"><button className="btn-primary">Masuk dengan Clerk</button></SignInButton>
        </div>
      </Show>
    </>
  )
}
