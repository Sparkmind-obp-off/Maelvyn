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
import VentureGovernance from './pages/VentureGovernance'
import VentureFinance from './pages/VentureFinance'
import VentureRights from './pages/VentureRights'
import VentureOps from './pages/VentureOps'
import VentureMemory from './pages/VentureMemory'
import VentureTeam from './pages/VentureTeam'
import VentureArtifacts from './pages/VentureArtifacts'

function WorkspaceNav() {
  const { wid } = useParams()
  if (!wid) return null
  const cls = ({ isActive }: { isActive: boolean }) => `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`
  return (
    <nav aria-label="Workspace" className="mb-6 flex flex-wrap gap-1 border-b border-slate-800 pb-3">
      <NavLink end to={`/w/${wid}`} className={cls}>Ringkasan &amp; Venture</NavLink>
      <NavLink to={`/w/${wid}/portfolio`} className={cls}>Portofolio</NavLink>
      <NavLink to={`/w/${wid}/governance`} className={cls}>Governance</NavLink>
      <NavLink to={`/w/${wid}/members`} className={cls}>Anggota</NavLink>
      <NavLink to={`/w/${wid}/providers`} className={cls}>Provider &amp; Kill switch</NavLink>
      <NavLink to={`/w/${wid}/agents`} className={cls}>Registry Agen</NavLink>
      <NavLink to={`/w/${wid}/audit`} className={cls}>Audit</NavLink>
    </nav>
  )
}

function VentureNav() {
  const { wid, vid } = useParams()
  const cls = ({ isActive }: { isActive: boolean }) => `rounded-md px-3 py-1 text-xs ${isActive ? 'bg-sky-900/60 text-sky-100' : 'text-slate-400 hover:text-white'}`
  const base = `/w/${wid}/v/${vid}`
  return (
    <nav aria-label="Venture" className="mb-6 flex flex-wrap gap-1">
      <NavLink end to={base} className={cls}>Riset</NavLink>
      <NavLink to={`${base}/governance`} className={cls}>Charter &amp; Lifecycle</NavLink>
      <NavLink to={`${base}/team`} className={cls}>Tim</NavLink>
      <NavLink to={`${base}/finance`} className={cls}>Keuangan</NavLink>
      <NavLink to={`${base}/rights`} className={cls}>Kontribusi &amp; Hak</NavLink>
      <NavLink to={`${base}/ops`} className={cls}>Operasi</NavLink>
      <NavLink to={`${base}/memory`} className={cls}>Memori</NavLink>
      <NavLink to={`${base}/artifacts`} className={cls}>Artefak</NavLink>
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
      {environment !== 'production' && (
        <div role="note" className="bg-amber-500/15 px-4 py-1.5 text-center text-xs text-amber-200">
          Lingkungan <strong>{environment}</strong> · identitas <strong>{identityInstance}</strong> · data <strong>{dataPolicy}</strong> — jangan masukkan data peserta, keuangan, atau rahasia nyata.
        </div>
      )}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
            <img src="/favicon.svg" alt="" className="h-7 w-7" /> MAELVYN
            <span className="hidden text-xs font-normal text-slate-500 sm:inline">Agentic Shared Venture Studio OS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <Link to="/workspaces" className="text-sm text-slate-300 hover:text-white">Workspace</Link>
              <Link to="/me" className="text-sm text-slate-300 hover:text-white">Saya</Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal"><button className="btn-primary">Masuk</button></SignInButton>
            </Show>
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
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
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Participation by Choice. Ownership by Agreement. · Repositori ini bukan entitas hukum, penawaran investasi, atau komitmen mengikat.
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
        <div className="card mx-auto max-w-md text-center">
          <p className="mb-4 text-slate-300">Silakan masuk untuk mengakses workspace.</p>
          <SignInButton mode="modal"><button className="btn-primary">Masuk dengan Clerk</button></SignInButton>
        </div>
      </Show>
    </>
  )
}
