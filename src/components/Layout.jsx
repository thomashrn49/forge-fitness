import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Dumbbell, BookOpen, CalendarRange, History, TrendingUp, Flame, Calculator, User, Menu, Play, X, LogOut, Smartphone,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { fmtClock, xpInfo } from '../lib/calc'
import { Modal } from './ui'

export const NAV = [
  { to: '/', label: 'Tableau de bord', short: 'Accueil', icon: LayoutDashboard },
  { to: '/seance', label: 'Séance', short: 'Séance', icon: Dumbbell },
  { to: '/exercices', label: 'Exercices', short: 'Exercices', icon: BookOpen },
  { to: '/programmes', label: 'Programmes', short: 'Programmes', icon: CalendarRange },
  { to: '/historique', label: 'Historique', short: 'Historique', icon: History },
  { to: '/progression', label: 'Progression', short: 'Progrès', icon: TrendingUp },
  { to: '/calories', label: 'Calories & poids', short: 'Calories', icon: Flame },
  { to: '/outils', label: 'Outils', short: 'Outils', icon: Calculator },
  { to: '/profil', label: 'Profil', short: 'Profil', icon: User },
  { to: '/installer', label: 'Installer l’app', short: 'Installer', icon: Smartphone },
]

export function useElapsed(startedAt) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!startedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [startedAt])
  return startedAt ? (now - new Date(startedAt).getTime()) / 1000 : 0
}

export function Logo({ compact }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 cursor-pointer" aria-label="FORGE — accueil">
      <span className="grid place-items-center size-9 rounded-xl bg-primary text-bg shadow-glow">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true"><path d="M9 23V9h13v3.6h-8.6v2.2h7v3.5h-7V23z" fill="currentColor" /></svg>
      </span>
      {!compact && <span className="font-display text-2xl font-extrabold tracking-wide">FORGE</span>}
    </Link>
  )
}

function SideLink({ item, active }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to} end={item.to === '/'}
      className={({ isActive }) =>
        `group shrink-0 flex items-center gap-3 h-11 px-3 rounded-xl font-semibold transition cursor-pointer ${isActive ? 'bg-primary/12 text-primary' : 'text-muted hover:text-ink hover:bg-raised'}`
      }
    >
      <Icon size={19} aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {active && item.to === '/seance' && (
        <span className="flex items-center gap-1.5 text-xs font-bold text-success">
          <span className="size-2 rounded-full bg-success animate-pulse" />LIVE
        </span>
      )}
    </NavLink>
  )
}

function ActiveBanner({ active }) {
  const elapsed = useElapsed(active.startedAt)
  return (
    <Link
      to="/seance"
      className="fixed z-40 left-3 right-3 bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-6 lg:left-auto lg:right-6 lg:w-80 flex items-center gap-3 p-3 pr-4 rounded-2xl bg-primary text-bg shadow-glow cursor-pointer animate-fade-up"
    >
      <span className="grid place-items-center size-10 rounded-xl bg-bg/15"><Play size={18} fill="currentColor" aria-hidden="true" /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wider opacity-80">Séance en cours</span>
        <span className="block font-semibold truncate">{active.name}</span>
      </span>
      <span className="font-display text-2xl font-bold tabular">{fmtClock(elapsed)}</span>
    </Link>
  )
}

export default function Layout() {
  const active = useStore((s) => s.active)
  const workouts = useStore((s) => s.workouts)
  const profile = useStore((s) => s.profile)
  const { pathname } = useLocation()
  const [more, setMore] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const logout = useStore((s) => s.logout)
  const navigate = useNavigate()
  const xp = useMemo(() => xpInfo(workouts), [workouts])
  const doLogout = () => { setConfirmOut(false); setMore(false); navigate('/', { replace: true }); logout() }
  const askLogout = () => (active ? setConfirmOut(true) : doLogout())

  useEffect(() => { window.scrollTo(0, 0); setMore(false) }, [pathname])

  const bottom = [NAV[0], NAV[2], NAV[1], NAV[5]]

  return (
    <div className="min-h-dvh lg:pl-[260px]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] btn-primary btn-sm">Aller au contenu</a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] flex-col border-r border-line/70 bg-surface/60 backdrop-blur-xl py-6">
        <div className="px-6 shrink-0"><Logo /></div>
        <nav className="mt-6 flex-1 min-h-0 overflow-y-auto px-4 py-2 flex flex-col gap-1" aria-label="Navigation principale">
          {NAV.map((n) => <SideLink key={n.to} item={n} active={!!active} />)}
        </nav>
        <div className="shrink-0 px-4 pt-4 border-t border-line/60 mx-0">
          <Link to="/profil" className="card p-3 flex items-center gap-3 hover:border-faint transition cursor-pointer">
            <span className="grid place-items-center size-10 rounded-full bg-gradient-to-br from-primary to-warning text-bg font-display text-lg font-bold">
              {(profile?.name || '?')[0].toUpperCase()}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold truncate">{profile?.name}</span>
              <span className="block text-xs text-muted">Niv. {xp.level} · {xp.title}</span>
              <span className="block mt-1.5 h-1.5 rounded-full bg-raised overflow-hidden">
                <span className="block h-full bg-primary rounded-full" style={{ width: `${xp.progress * 100}%` }} />
              </span>
            </span>
          </Link>
          <button onClick={askLogout} className="btn-ghost h-10 text-sm w-full mt-2" title="Revenir à la liste des profils">
            <LogOut size={15} aria-hidden="true" />Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-bg/80 backdrop-blur-xl border-b border-line/60">
        <Logo />
        <Link to="/profil" className="grid place-items-center size-10 rounded-full bg-gradient-to-br from-primary to-warning text-bg font-display text-lg font-bold" aria-label="Profil">
          {(profile?.name || '?')[0].toUpperCase()}
        </Link>
      </header>

      <main id="main" className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-36 lg:pb-16 max-w-[1400px] mx-auto">
        <Outlet />
      </main>

      {active && pathname !== '/seance' && <ActiveBanner active={active} />}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="Navigation principale">
        <div className="grid grid-cols-5 h-[68px]">
          {bottom.map((n) => {
            const Icon = n.icon
            const center = n.to === '/seance'
            return (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${isActive ? 'text-primary' : 'text-muted'}`}>
                {center ? (
                  <span className={`grid place-items-center size-12 -mt-5 rounded-2xl shadow-glow ${active ? 'bg-success' : 'bg-primary'} text-bg`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                ) : <Icon size={21} aria-hidden="true" />}
                <span>{n.short}</span>
              </NavLink>
            )
          })}
          <button onClick={() => setMore(true)} className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted cursor-pointer" aria-haspopup="dialog">
            <Menu size={21} aria-hidden="true" /><span>Plus</span>
          </button>
        </div>
      </nav>

      <Modal open={confirmOut} onClose={() => setConfirmOut(false)} title="Se déconnecter ?" size="sm"
        footer={<>
          <button className="btn-ghost btn-md" onClick={() => setConfirmOut(false)}>Annuler</button>
          <button className="btn-primary btn-md" onClick={doLogout}><LogOut size={17} aria-hidden="true" />Se déconnecter</button>
        </>}>
        <p className="text-muted">Une séance est en cours. Elle sera conservée et tu la retrouveras en revenant sur ton profil, mais le chrono continuera de tourner.</p>
      </Modal>

      {more && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Plus de pages">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMore(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-surface border-t border-line rounded-t-2xl p-4 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Navigation</span>
              <button className="btn-ghost size-10 rounded-full" onClick={() => setMore(false)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NAV.map((n) => {
                const Icon = n.icon
                return (
                  <NavLink key={n.to} to={n.to} end={n.to === '/'}
                    className={({ isActive }) => `flex flex-col items-center gap-2 p-3 rounded-xl text-sm font-semibold text-center cursor-pointer ${isActive ? 'bg-primary/12 text-primary' : 'bg-raised text-ink'}`}>
                    <Icon size={22} aria-hidden="true" />{n.short}
                  </NavLink>
                )
              })}
            </div>
            <button onClick={askLogout} className="btn-ghost btn-md w-full mt-3"><LogOut size={17} aria-hidden="true" />Se déconnecter · changer de profil</button>
          </div>
        </div>
      )}
    </div>
  )
}
