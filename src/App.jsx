import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './lib/store'
import Layout from './components/Layout'
import Onboarding from './pages/Onboarding'
import ProfilePicker from './pages/ProfilePicker'
import Dashboard from './pages/Dashboard'
import Workout from './pages/Workout'
import Exercises from './pages/Exercises'
import Programs from './pages/Programs'
import HistoryPage from './pages/History'
import WorkoutDetail from './pages/WorkoutDetail'
import Progress from './pages/Progress'
import Calories from './pages/Calories'
import Tools from './pages/Tools'
import Profile from './pages/Profile'
import Install from './pages/Install'
import { UpdatePrompt, StorageAlert } from './components/AppBanners'

// the store loads asynchronously from the phone's storage: wait before deciding which screen to show
function useHydrated() {
  const [done, setDone] = useState(() => useStore.persist.hasHydrated())
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setDone(true)
    return useStore.persist.onFinishHydration(() => setDone(true))
  }, [])
  return done
}

function Splash() {
  return (
    <div className="min-h-dvh grid place-items-center" aria-busy="true" aria-label="Chargement">
      <span className="grid place-items-center size-16 rounded-2xl bg-primary text-bg shadow-glow animate-pulse">
        <svg viewBox="0 0 32 32" className="size-10" aria-hidden="true"><path d="M9 23V9h13v3.6h-8.6v2.2h7v3.5h-7V23z" fill="currentColor" /></svg>
      </span>
    </div>
  )
}

export default function App() {
  return <><Screens /><UpdatePrompt /><StorageAlert /></>
}

function Screens() {
  const hydrated = useHydrated()
  const profile = useStore((s) => s.profile)
  const hasAccounts = useStore((s) => Object.values(s.accounts || {}).some((a) => a.profile))
  const [creating, setCreating] = useState(false)
  if (!hydrated) return <Splash />
  if (!profile) {
    if (creating || !hasAccounts) return <Onboarding onBack={hasAccounts ? () => setCreating(false) : undefined} onDone={() => setCreating(false)} />
    return <ProfilePicker onCreate={() => setCreating(true)} />
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="seance" element={<Workout />} />
        <Route path="exercices" element={<Exercises />} />
        <Route path="programmes" element={<Programs />} />
        <Route path="historique" element={<HistoryPage />} />
        <Route path="historique/:id" element={<WorkoutDetail />} />
        <Route path="progression" element={<Progress />} />
        <Route path="calories" element={<Calories />} />
        <Route path="outils" element={<Tools />} />
        <Route path="profil" element={<Profile />} />
        <Route path="installer" element={<Install />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
