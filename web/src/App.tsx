import { Show, SignInButton, UserButton } from '@clerk/react'
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

function WorkspaceNav() {
  const { wid } = useParams()
  if (!wid) return null
  const cls = ({ isActive }: { isActive: boolean }) => `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`
  return (
    <nav aria-label="Workspace" className="mb-6 flex flex-wrap gap-1 border-b border-slate-800 pb-3">
      <NavLink end to={`/w/${wid}`} className={cls}>Ringkasan &amp; Venture</NavLink>
      <NavLink to={`/w/${wid}/members`} className={cls}>Anggota</NavLink>
      <NavLink to={`/w/${wid}/providers`} className={cls}>Provider &amp; Kill switch</NavLink>
      <NavLink to={`/w/${wid}/agents`} className={cls}>Registry Agen</NavLink>
      <NavLink to={`/w/${wid}/audit`} className={cls}>Audit</NavLink>
    </nav>
  )
}

function WithNav({ children }: { children: React.ReactNode }) {
  return <><WorkspaceNav />{children}</>
}

export default function App({ environment, identityInstance, dataPolicy }: { environment: string; identityInstance: string; dataPolicy: string }) {
  return (
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
          <Route path="/w/:wid/v/:vid" element={<Protected><WithNav><VenturePage /></WithNav></Protected>} />
          <Route path="/w/:wid/research/:tid" element={<Protected><WithNav><ResearchPage /></WithNav></Protected>} />
          <Route path="*" element={<p className="text-slate-400">Halaman tidak ditemukan.</p>} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Participation by Choice. Ownership by Agreement. · Repositori ini bukan entitas hukum, penawaran investasi, atau komitmen mengikat.
      </footer>
    </div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <div className="card mx-auto max-w-md text-center">
          <p className="mb-4 text-slate-300">Silakan masuk untuk mengakses workspace.</p>
          <SignInButton mode="modal"><button className="btn-primary">Masuk dengan Clerk (Development)</button></SignInButton>
        </div>
      </Show>
    </>
  )
}
