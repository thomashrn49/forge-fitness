import { useMemo, useState } from 'react'
import { Search, Star, Dumbbell, Flame, SlidersHorizontal, Wand2, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, LevelDots, EmptyState } from '../components/ui'
import BodyMap from '../components/BodyMap'
import { hasDemo, demoThumb } from '../data/demos'
import ExerciseDetail from '../components/ExerciseDetail'
import SmartSearch, { Highlight, saveRecent } from '../components/SmartSearch'
import { EXERCISES, MUSCLE_GROUPS, MUSCLES, EQUIPMENT, LEVELS, exerciseGroup } from '../data/exercises'
import { computeRecords, fmt } from '../lib/calc'
import { searchExercises, EXAMPLE_QUERIES } from '../lib/search'
import { useIncremental } from '../lib/useIncremental'

export default function Exercises() {
  const { favorites, toggleFavorite, workouts, profile } = useStore()
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')
  const [equip, setEquip] = useState('')
  const [level, setLevel] = useState(0)
  const [sort, setSort] = useState('relevance')
  const [open, setOpen] = useState(null)
  const records = useMemo(() => computeRecords(workouts), [workouts])
  const usage = useMemo(() => {
    const u = {}
    for (const w of workouts) for (const e of w.exercises) u[e.exId] = (u[e.exId] || 0) + 1
    return u
  }, [workouts])

  const search = useMemo(() => searchExercises(q), [q])
  const list = useMemo(() => {
    const l = search.results.filter(({ ex: e }) =>
      (group === 'all' || (group === 'fav' ? favorites.includes(e.id) : exerciseGroup(e) === group)) &&
      (!equip || e.equipment === equip) && (!level || e.level === level),
    )
    const effective = sort === 'relevance' && !q.trim() ? 'name' : sort
    if (effective === 'used') l.sort((a, b) => (usage[b.ex.id] || 0) - (usage[a.ex.id] || 0))
    else if (effective === 'kcal') l.sort((a, b) => b.ex.met - a.ex.met)
    else if (effective === 'name') l.sort((a, b) => a.ex.name.localeCompare(b.ex.name, 'fr'))
    return l
  }, [search, group, equip, level, sort, favorites, usage, q])

  const { visible, sentinel, hasMore } = useIncremental(list)
  const filtersOn = group !== 'all' || !!equip || level > 0
  const resetAll = () => { setQ(''); setGroup('all'); setEquip(''); setLevel(0) }

  return (
    <div>
      <PageHeader eyebrow="Bibliothèque" title="Exercices" subtitle={`${EXERCISES.length} exercices : technique, erreurs à éviter, muscles ciblés, dépense estimée et ta progression personnelle.`} />

      <div className="card p-4 mb-5 space-y-3 animate-fade-up relative z-10">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="flex-1 min-w-0"><SmartSearch value={q} onChange={setQ} onOpen={setOpen} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 xl:flex">
            <select className="input h-12 xl:w-40" value={equip} onChange={(e) => setEquip(e.target.value)} aria-label="Matériel">
              <option value="">Tout matériel</option>
              {EQUIPMENT.map((e) => <option key={e}>{e}</option>)}
            </select>
            <select className="input h-12 xl:w-40" value={level} onChange={(e) => setLevel(+e.target.value)} aria-label="Niveau">
              <option value={0}>Tous niveaux</option>
              {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input h-12 xl:w-44" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
              <option value="relevance">Pertinence</option>
              <option value="name">A → Z</option>
              <option value="used">Les plus faits</option>
              <option value="kcal">Les plus brûle-calories</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[{ id: 'all', label: 'Tous' }, { id: 'fav', label: `Favoris (${favorites.length})` }, ...MUSCLE_GROUPS].map((g) => (
            <button key={g.id} className={group === g.id ? 'chip-on' : 'chip-off'} onClick={() => setGroup(g.id)} aria-pressed={group === g.id}>
              {g.id === 'fav' && <Star size={14} aria-hidden="true" />}{g.label}
            </button>
          ))}
        </div>
      </div>

      {/* What the search understood */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3 text-sm text-muted min-h-[28px]" aria-live="polite">
        <span className="flex items-center gap-2"><SlidersHorizontal size={14} aria-hidden="true" />{list.length} résultat{list.length > 1 ? 's' : ''}</span>
        {search.intent.level && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-info/10 text-info"><Wand2 size={13} aria-hidden="true" />Niveau compris : {LEVELS[search.intent.level]}</span>
        )}
        {search.ignored.length > 0 && search.results.length > 0 && (
          <span>Mot{search.ignored.length > 1 ? 's' : ''} ignoré{search.ignored.length > 1 ? 's' : ''} : « {search.ignored.join(', ')} »</span>
        )}
        {search.suggestion && (
          <span>Tu voulais dire <button className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => { setQ(search.suggestion); saveRecent(search.suggestion) }}>« {search.suggestion} »</button> ?</span>
        )}
        {filtersOn && <button onClick={() => { setGroup('all'); setEquip(''); setLevel(0) }} className="flex items-center gap-1 text-primary hover:underline cursor-pointer"><X size={13} aria-hidden="true" />Retirer les filtres</button>}
      </div>

      {list.length ? (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {visible.map(({ ex: e, why }, i) => {
            const fav = favorites.includes(e.id)
            const rec = records[e.id]
            return (
              <li key={e.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                <div className="group card h-full flex overflow-hidden hover:border-primary/50 transition">
                  <button onClick={() => { if (q) saveRecent(q); setOpen(e.id) }} className="flex-1 flex gap-3 p-4 text-left cursor-pointer min-w-0">
                    {hasDemo(e.id) ? (
                      <img src={demoThumb(e.id)} alt="" loading="lazy" decoding="async" width="96" height="64"
                        className="w-24 h-16 shrink-0 rounded-xl object-cover bg-raised self-start" />
                    ) : (
                      <div className="w-24 h-16 shrink-0 rounded-xl bg-raised/60 p-1 self-start">
                        <BodyMap primary={e.primary} secondary={e.secondary} className="[&_figcaption]:hidden h-full [&_svg]:max-h-14" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-bold uppercase leading-tight group-hover:text-primary transition"><Highlight text={e.name} query={q} /></h3>
                      <p className="text-sm text-muted mt-0.5 truncate">{e.primary.map((m) => MUSCLES[m]).join(', ')}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-muted">
                        <span className="flex items-center gap-1"><Dumbbell size={12} aria-hidden="true" />{e.equipment}</span>
                        <span className="flex items-center gap-1"><Flame size={12} aria-hidden="true" />{Math.round(e.met * (profile.weight || 75) / 6)} kcal/10min</span>
                        <LevelDots level={e.level} />
                      </div>
                      {q.trim() && why.length > 0 && (
                        <p className="text-xs mt-2 text-info truncate" title={why.join(' · ')}>Trouvé via : {why.slice(0, 3).join(' · ')}</p>
                      )}
                      {rec && (rec.e1rm || rec.reps || rec.sec) ? (
                        <p className="text-xs font-semibold text-primary mt-1.5">
                          Record : {rec.e1rm ? `${fmt(rec.e1rm, 1)} kg (1RM est.)` : rec.sec ? `${rec.sec} s` : `${rec.reps} reps`}
                        </p>
                      ) : null}
                    </div>
                  </button>
                  <button onClick={() => toggleFavorite(e.id)} aria-pressed={fav} aria-label={fav ? `Retirer ${e.name} des favoris` : `Ajouter ${e.name} aux favoris`}
                    className="self-start m-2 grid place-items-center size-10 rounded-xl hover:bg-raised cursor-pointer">
                    <Star size={18} className={fav ? 'fill-primary text-primary' : 'text-faint'} />
                  </button>
                </div>
              </li>
            )
          })}
          {hasMore && <li ref={sentinel} className="sm:col-span-2 xl:col-span-3 2xl:col-span-4 h-10" aria-hidden="true" />}
        </ul>
      ) : (
        <EmptyState icon={Search} title="Aucun résultat"
          text={search.suggestion ? `Essaie « ${search.suggestion} », ou une des recherches ci-dessous.` : 'Essaie un autre mot : un muscle (pecs, fessiers), un matériel (haltères, poulie) ou un objectif (débutant, sans matériel).'}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.slice(0, 5).map((ex) => <button key={ex} className="chip-off" onClick={() => { resetAll(); setQ(ex) }}>{ex}</button>)}
            </div>
          } />
      )}

      <ExerciseDetail exId={open} onClose={() => setOpen(null)} />
    </div>
  )
}
