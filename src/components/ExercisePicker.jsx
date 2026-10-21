import { useMemo, useState } from 'react'
import { Search, Check, Star } from 'lucide-react'
import { Modal } from './ui'
import { MUSCLE_GROUPS, MUSCLES, exerciseGroup } from '../data/exercises'
import { searchExercises } from '../lib/search'
import { Highlight } from './SmartSearch'
import { useStore } from '../lib/store'
import { useIncremental } from '../lib/useIncremental'
import { hasDemo, demoThumb } from '../data/demos'


export default function ExercisePicker({ open, onClose, onPick, title = 'Ajouter des exercices' }) {
  const favorites = useStore((s) => s.favorites)
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')
  const [sel, setSel] = useState([])

  const search = useMemo(() => searchExercises(q), [q])
  const list = useMemo(() => {
    const l = search.results.map((r) => r.ex).filter((e) =>
      group === 'all' || (group === 'fav' ? favorites.includes(e.id) : exerciseGroup(e) === group))
    return q.trim() ? l : l.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [search, group, favorites, q])

  const { visible, sentinel, hasMore } = useIncremental(list, 30)
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const close = () => { setSel([]); setQ(''); onClose() }

  return (
    <Modal
      open={open} onClose={close} title={title} size="lg"
      footer={
        <>
          <button className="btn-ghost btn-md" onClick={close}>Annuler</button>
          <button className="btn-primary btn-md" disabled={!sel.length} onClick={() => { onPick(sel); close() }}>
            Ajouter {sel.length ? `(${sel.length})` : ''}
          </button>
        </>
      }
    >
      <div className="sticky top-0 bg-surface pb-3 z-10">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            className="input pl-10" placeholder="pecs haltères, dos sans matériel, squat…" value={q}
            onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un exercice" data-autofocus
          />
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-1 px-1">
          {[{ id: 'all', label: 'Tous' }, { id: 'fav', label: 'Favoris' }, ...MUSCLE_GROUPS].map((g) => (
            <button key={g.id} className={group === g.id ? 'chip-on' : 'chip-off'} onClick={() => setGroup(g.id)}>
              {g.id === 'fav' && <Star size={14} aria-hidden="true" />}{g.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2">
        {visible.map((e) => {
          const on = sel.includes(e.id)
          return (
            <li key={e.id}>
              <button
                onClick={() => toggle(e.id)} aria-pressed={on}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${on ? 'border-primary bg-primary/10' : 'border-line bg-raised/50 hover:border-faint'}`}
              >
                <span className={`grid place-items-center size-6 rounded-md border shrink-0 ${on ? 'bg-primary border-primary text-bg' : 'border-faint'}`}>
                  {on && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                </span>
                {hasDemo(e.id)
                  ? <img src={demoThumb(e.id)} alt="" loading="lazy" decoding="async" width="56" height="38" className="w-14 h-[38px] rounded-lg object-cover bg-raised shrink-0" />
                  : <span className="w-14 h-[38px] rounded-lg bg-raised shrink-0" aria-hidden="true" />}
                <span className="min-w-0">
                  <span className="block font-semibold truncate"><Highlight text={e.name} query={q} /></span>
                  <span className="block text-sm text-muted truncate">{e.primary.map((m) => MUSCLES[m]).join(', ')} · {e.equipment}</span>
                </span>
              </button>
            </li>
          )
        })}
        {hasMore && <li ref={sentinel} className="sm:col-span-2 h-8" aria-hidden="true" />}
      </ul>
      {!list.length && (
        <p className="text-center text-muted py-10">
          Aucun exercice ne correspond.
          {search.suggestion && <> Tu voulais dire <button className="text-primary font-semibold hover:underline cursor-pointer" onClick={() => setQ(search.suggestion)}>« {search.suggestion} »</button> ?</>}
        </p>
      )}
    </Modal>
  )
}
