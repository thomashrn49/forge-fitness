import { ArrowRight, Truck } from 'lucide-react'
import { useStore } from '../lib/store'
import BackupButton from './BackupButton'

// Shown only on the old address (build-time flag VITE_MOVED_TO): guides users to the new one without losing data.
const NEW_URL = import.meta.env.VITE_MOVED_TO

export default function MovedBanner() {
  const hasData = useStore((s) => !!s.profile || Object.keys(s.accounts || {}).length > 0)
  if (!NEW_URL) return null
  return (
    <div className="fixed inset-x-0 top-0 z-[90] p-3 pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="max-w-xl mx-auto card border-primary/60 bg-surface p-4 shadow-2xl">
        <p className="flex items-center gap-2 font-display text-2xl font-bold uppercase"><Truck size={20} className="text-primary" aria-hidden="true" />FORGE déménage</p>
        <p className="text-sm text-muted mt-1">L’app a une nouvelle adresse. Tes données ne suivent pas automatiquement : fais ces 3 étapes.</p>
        <ol className="mt-3 space-y-2.5 text-[15px]">
          <li className="flex gap-2 items-start"><b className="text-primary">1.</b><span className="flex-1">{hasData ? 'Sauvegarde tes données ici :' : 'Tu n’as pas de données ici, passe à l’étape 2.'}{hasData && <span className="block mt-2"><BackupButton className="btn-primary btn-sm" /></span>}</span></li>
          <li className="flex gap-2"><b className="text-primary">2.</b><span>Ouvre la nouvelle adresse dans Safari et ajoute-la à l’écran d’accueil :<a href={NEW_URL} className="btn-ghost btn-sm mt-2 w-fit flex">{NEW_URL.replace('https://', '')}<ArrowRight size={15} aria-hidden="true" /></a></span></li>
          <li className="flex gap-2"><b className="text-primary">3.</b><span>Dans la nouvelle app, touche <b>« J’ai une sauvegarde »</b> et choisis ton fichier. Tu peux ensuite supprimer l’ancienne icône.</span></li>
        </ol>
      </div>
    </div>
  )
}
