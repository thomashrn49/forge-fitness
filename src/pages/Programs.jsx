import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Plus, Pencil, Trash2, CalendarDays, Target, ChevronDown, Layers, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, Card, Modal, LevelDots, EmptyState } from '../components/ui'
import ExercisePicker from '../components/ExercisePicker'
import { PROGRAMS } from '../data/programs'
import { EX_BY_ID, MUSCLES, LEVELS } from '../data/exercises'

const GOAL_LABEL = { lose: 'Perte de gras', muscle: 'Hypertrophie', strength: 'Force', maintain: 'Forme' }

export default function Programs() {
  const { templates, startWorkout, active, deleteTemplate, profile } = useStore()
  const navigate = useNavigate()
  const [openProg, setOpenProg] = useState(PROGRAMS.find((p) => p.goal === profile.goal)?.id || 'ppl')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const go = (tpl, programId) => { startWorkout({ ...tpl, programId }); navigate('/seance') }

  return (
    <div>
      <PageHeader eyebrow="Plans d’entraînement" title="Programmes"
        subtitle="Des programmes construits par objectif. Démarre une séance en un clic : les charges de ta dernière séance sont reprises automatiquement."
        actions={<button className="btn-primary btn-md" onClick={() => setEditing({ name: '', focus: '', exercises: [] })}><Plus size={18} aria-hidden="true" />Créer un modèle</button>} />

      {active && <p className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-sm">Une séance est déjà en cours. Termine-la avant d’en lancer une autre.</p>}

      <div className="grid gap-4">
        {PROGRAMS.map((p, i) => {
          const open = openProg === p.id
          const recommended = p.goal === profile.goal
          return (
            <Card key={p.id} className="overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <button onClick={() => setOpenProg(open ? null : p.id)} aria-expanded={open}
                className={`w-full text-left p-5 sm:p-6 bg-gradient-to-r ${p.accent} to-transparent cursor-pointer`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="eyebrow">{p.tagline}</span>
                      {recommended && <span className="px-2 py-0.5 rounded-md bg-primary text-bg text-[11px] font-bold uppercase tracking-wider">Recommandé pour toi</span>}
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase mt-1">{p.name}</h2>
                    <p className="text-muted mt-1 max-w-2xl">{p.description}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm">
                      <span className="flex items-center gap-1.5"><CalendarDays size={15} className="text-primary" aria-hidden="true" />{p.perWeek} séances / sem.</span>
                      <span className="flex items-center gap-1.5"><Layers size={15} className="text-primary" aria-hidden="true" />{p.days.length} séance{p.days.length > 1 ? 's' : ''} type</span>
                      <span className="flex items-center gap-1.5"><Target size={15} className="text-primary" aria-hidden="true" />{GOAL_LABEL[p.goal]}</span>
                      <span className="flex items-center gap-2"><LevelDots level={p.level} />{LEVELS[p.level]}</span>
                    </div>
                  </div>
                  <ChevronDown size={22} className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </div>
              </button>
              {open && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 sm:p-6 pt-0 sm:pt-0 animate-fade-up">
                  {p.days.map((d) => (
                    <div key={d.id} className="rounded-xl border border-line bg-raised/40 p-4 flex flex-col">
                      <div className="font-display text-2xl font-bold uppercase">{d.name}</div>
                      <div className="text-sm text-muted">{d.focus}</div>
                      <ol className="mt-3 space-y-1.5 text-sm flex-1">
                        {d.exercises.map((e) => (
                          <li key={e.exId} className="flex justify-between gap-3">
                            <span className="truncate">{EX_BY_ID[e.exId].name}</span>
                            <span className="text-muted tabular shrink-0">{e.sets} × {e.reps}</span>
                          </li>
                        ))}
                      </ol>
                      <button className="btn-primary btn-md mt-4" disabled={!!active} onClick={() => go(d, p.id)}><Play size={16} fill="currentColor" aria-hidden="true" />Démarrer</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <section className="mt-10">
        <h2 className="text-3xl font-bold uppercase mb-4">Mes modèles</h2>
        {templates.length ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {templates.map((t) => (
              <Card key={t.id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-2xl font-bold uppercase truncate">{t.name}</div>
                    {t.focus && <div className="text-sm text-muted truncate">{t.focus}</div>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="btn-ghost size-9 rounded-lg" onClick={() => setEditing(t)} aria-label={`Modifier ${t.name}`}><Pencil size={15} /></button>
                    <button className="btn-ghost size-9 rounded-lg hover:text-danger" onClick={() => setToDelete(t)} aria-label={`Supprimer ${t.name}`}><Trash2 size={15} /></button>
                  </div>
                </div>
                <ol className="mt-3 space-y-1 text-sm flex-1">
                  {t.exercises.map((e, i) => (
                    <li key={i} className="flex justify-between gap-3"><span className="truncate">{EX_BY_ID[e.exId]?.name}</span><span className="text-muted tabular">{e.sets} × {e.reps}</span></li>
                  ))}
                </ol>
                <button className="btn-primary btn-md mt-4" disabled={!!active || !t.exercises.length} onClick={() => go(t, null)}><Play size={16} fill="currentColor" aria-hidden="true" />Démarrer</button>
              </Card>
            ))}
          </div>
        ) : (
          <Card><EmptyState icon={Layers} title="Aucun modèle perso" text="Crée tes propres séances types pour les lancer en un clic." action={<button className="btn-primary btn-md" onClick={() => setEditing({ name: '', focus: '', exercises: [] })}><Plus size={18} aria-hidden="true" />Créer un modèle</button>} /></Card>
        )}
      </section>

      {editing && <TemplateEditor initial={editing} onClose={() => setEditing(null)} />}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer le modèle ?" size="sm"
        footer={<><button className="btn-ghost btn-md" onClick={() => setToDelete(null)}>Annuler</button><button className="btn-danger btn-md" onClick={() => { deleteTemplate(toDelete.id); setToDelete(null) }}>Supprimer</button></>}>
        <p className="text-muted">Le modèle « {toDelete?.name} » sera supprimé. Tes séances passées restent dans l’historique.</p>
      </Modal>
    </div>
  )
}

export function TemplateEditor({ initial, onClose }) {
  const saveTemplate = useStore((s) => s.saveTemplate)
  const [t, setT] = useState(() => structuredClone(initial))
  const [picker, setPicker] = useState(false)
  const [err, setErr] = useState('')
  const upd = (i, patch) => setT((s) => ({ ...s, exercises: s.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) }))
  const save = () => {
    if (!t.name.trim()) return setErr('Donne un nom à ton modèle.')
    if (!t.exercises.length) return setErr('Ajoute au moins un exercice.')
    saveTemplate({ ...t, name: t.name.trim() })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={initial.id ? 'Modifier le modèle' : 'Nouveau modèle'} size="lg"
      footer={<><button className="btn-ghost btn-md" onClick={onClose}>Annuler</button><button className="btn-primary btn-md" onClick={save}>Enregistrer</button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="tpl-name">Nom</label>
          <input id="tpl-name" className="input" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="Ex. : Bras & épaules" data-autofocus />
        </div>
        <div>
          <label className="label" htmlFor="tpl-focus">Description (facultatif)</label>
          <input id="tpl-focus" className="input" value={t.focus || ''} onChange={(e) => setT({ ...t, focus: e.target.value })} placeholder="Biceps · Triceps · Épaules" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {t.exercises.map((e, i) => {
          const ex = EX_BY_ID[e.exId]
          return (
            <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_90px_90px_auto] gap-2 items-center p-3 rounded-xl bg-raised/50 border border-line">
              <div className="min-w-0 col-span-1">
                <div className="font-semibold truncate">{ex.name}</div>
                <div className="text-xs text-muted truncate">{ex.primary.map((m) => MUSCLES[m]).join(', ')}</div>
              </div>
              <button className="btn-ghost size-9 rounded-lg sm:order-last" onClick={() => setT({ ...t, exercises: t.exercises.filter((_, j) => j !== i) })} aria-label={`Retirer ${ex.name}`}><X size={16} /></button>
              <div className="col-span-2 sm:col-span-1 grid grid-cols-3 sm:contents gap-2">
                <label className="text-xs text-muted">Séries<input type="number" min="1" className="input h-9 mt-1" value={e.sets} onChange={(v) => upd(i, { sets: Math.max(1, +v.target.value) })} /></label>
                <label className="text-xs text-muted">{ex.type === 'time' ? 'Secondes' : ex.type === 'cardio' ? 'Minutes' : 'Reps'}<input className="input h-9 mt-1" value={e.reps} onChange={(v) => upd(i, { reps: v.target.value })} /></label>
                <label className="text-xs text-muted">Repos (s)<input type="number" min="0" step="15" className="input h-9 mt-1" value={e.rest} onChange={(v) => upd(i, { rest: +v.target.value })} /></label>
              </div>
            </div>
          )
        })}
        <button className="btn-outline btn-md w-full border-dashed" onClick={() => setPicker(true)}><Plus size={17} aria-hidden="true" />Ajouter des exercices</button>
      </div>
      {err && <p className="text-sm text-danger mt-3" role="alert">{err}</p>}
      <ExercisePicker open={picker} onClose={() => setPicker(false)}
        onPick={(ids) => setT((s) => ({ ...s, exercises: [...s.exercises, ...ids.map((id) => ({ exId: id, sets: EX_BY_ID[id].type === 'cardio' ? 1 : 3, reps: EX_BY_ID[id].type === 'time' ? '45' : EX_BY_ID[id].type === 'cardio' ? '20' : '10', rest: 90 }))] }))} />
    </Modal>
  )
}
