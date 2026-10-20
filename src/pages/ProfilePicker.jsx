import { useState } from 'react'
import { Plus, Trash2, ChevronRight, Flame, Dumbbell, Play } from 'lucide-react'
import { useStore, STORE_KEY } from '../lib/store'
import { snapshotNow } from '../lib/storage'
import { Logo } from '../components/Layout'
import { Modal } from '../components/ui'
import RestoreBackup from '../components/RestoreBackup'
import { relDay, fmt, xpInfo } from '../lib/calc'

const GRADIENTS = ['from-primary to-warning', 'from-info to-success', 'from-success to-warning', 'from-danger to-primary', 'from-warning to-success']

export default function ProfilePicker({ onCreate }) {
  const { accounts, switchProfile, deleteProfile } = useStore()
  const [toDelete, setToDelete] = useState(null)
  const list = Object.entries(accounts)
    .filter(([, a]) => a.profile)
    .sort((a, b) => (b[1].updatedAt || '').localeCompare(a[1].updatedAt || ''))

  return (
    <div className="min-h-dvh flex flex-col px-5 py-8 sm:py-14">
      <div className="max-w-3xl w-full mx-auto">
        <Logo />
        <div className="mt-12 sm:mt-16 animate-fade-up">
          <p className="eyebrow text-primary">Bon retour</p>
          <h1 className="text-5xl sm:text-6xl font-extrabold uppercase leading-none mt-1">Qui s’entraîne ?</h1>
          <p className="text-muted mt-3">Choisis ton profil ou crée-en un nouveau. Chaque profil a ses propres séances, pesées et records.</p>
        </div>

        <ul className="grid sm:grid-cols-2 gap-3 mt-8">
          {list.map(([id, a], i) => {
            const xp = xpInfo(a.workouts || [])
            const last = a.workouts?.[a.workouts.length - 1]
            const kcal = (a.workouts || []).reduce((t, w) => t + (w.calories || 0), 0)
            return (
              <li key={id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="group card flex items-center gap-2 pr-2 hover:border-primary/60 transition">
                  <button onClick={() => switchProfile(id)} className="flex-1 flex items-center gap-4 p-4 text-left cursor-pointer min-w-0">
                    <span className={`grid place-items-center size-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} text-bg font-display text-2xl font-extrabold shrink-0`}>
                      {a.profile.name[0]?.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-display text-2xl font-bold uppercase truncate">{a.profile.name}</span>
                        {a.active && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/15 text-success text-[10px] font-bold uppercase"><Play size={9} fill="currentColor" aria-hidden="true" />En cours</span>}
                      </span>
                      <span className="block text-sm text-muted">Niv. {xp.level} · {xp.title}</span>
                      <span className="flex gap-3 mt-1 text-xs text-muted">
                        <span className="flex items-center gap-1"><Dumbbell size={12} aria-hidden="true" />{a.workouts?.length || 0} séances</span>
                        <span className="flex items-center gap-1"><Flame size={12} aria-hidden="true" />{fmt(kcal)} kcal</span>
                        {last && <span className="hidden sm:inline">· {relDay(last.startedAt)}</span>}
                      </span>
                    </span>
                    <ChevronRight size={20} className="text-faint group-hover:text-primary transition shrink-0" aria-hidden="true" />
                  </button>
                  <button onClick={() => setToDelete({ id, name: a.profile.name })} className="btn-ghost size-10 rounded-xl hover:text-danger shrink-0" aria-label={`Supprimer le profil ${a.profile.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            )
          })}
          <li className="animate-fade-up" style={{ animationDelay: `${list.length * 50}ms` }}>
            <button onClick={onCreate} className="w-full h-full min-h-[96px] flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-line text-muted hover:border-primary hover:text-primary transition cursor-pointer">
              <span className="grid place-items-center size-14 rounded-2xl bg-raised shrink-0"><Plus size={24} aria-hidden="true" /></span>
              <span className="text-left">
                <span className="block font-display text-2xl font-bold uppercase">Nouveau profil</span>
                <span className="block text-sm">Configuration en 3 étapes</span>
              </span>
            </button>
          </li>
        </ul>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <RestoreBackup className="btn-ghost btn-md" label="Restaurer une sauvegarde" />
          <p className="text-sm text-faint">Les profils sont enregistrés uniquement sur ce téléphone.</p>
        </div>
      </div>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer ce profil ?" size="sm"
        footer={<>
          <button className="btn-ghost btn-md" onClick={() => setToDelete(null)}>Annuler</button>
          <button className="btn-danger btn-md" onClick={async () => { await snapshotNow(STORE_KEY, 'delete'); deleteProfile(toDelete.id); setToDelete(null) }}>Supprimer définitivement</button>
        </>}>
        <p className="text-muted">Le profil « {toDelete?.name} », ses séances, pesées et records seront supprimés de cet appareil. Cette action est irréversible.</p>
      </Modal>
    </div>
  )
}
