import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  TrendingUp, Wand2,
  Play, Plus, Check, Trash2, ChevronUp, ChevronDown, Info, Timer, Flame, Dumbbell, Flag, X, StickyNote, RotateCcw, Zap, ListChecks, MoreHorizontal,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useElapsed } from '../components/Layout'
import { useWakeLock } from '../lib/pwa'
import { Card, Modal, PageHeader, EmptyState } from '../components/ui'
import ExercisePicker from '../components/ExercisePicker'
import ExerciseDetail from '../components/ExerciseDetail'
import { EX_BY_ID, MUSCLES } from '../data/exercises'
import { PROGRAMS } from '../data/programs'
import { fmt, fmtClock, fmtKg, workoutCalories, lastPerformance, setVolume, relDay, fmtDuration, suggestProgression, computeRecords, e1rm } from '../lib/calc'
import PRCelebration from '../components/PRCelebration'
import { suggestNext } from './Dashboard'

// ── Sound cue at end of rest
let audioCtx
function beep() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)()
    const t = audioCtx.currentTime
    ;[0, 0.18, 0.36].forEach((d, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain()
      o.frequency.value = i === 2 ? 1046 : 784
      g.gain.setValueAtTime(0.0001, t + d)
      g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.15)
      o.connect(g).connect(audioCtx.destination)
      o.start(t + d); o.stop(t + d + 0.16)
    })
    navigator.vibrate?.([120, 60, 120])
  } catch { /* audio unavailable */ }
}

export default function Workout() {
  const active = useStore((s) => s.active)
  return active ? <ActiveWorkout /> : <StartScreen />
}

// ───────────────────────────────── Start screen
function StartScreen() {
  const { workouts, startWorkout, repeatWorkout, templates, lastProgram, profile } = useStore()
  const navigate = useNavigate()
  const next = suggestNext(workouts, lastProgram, profile.goal)
  const recent = workouts.slice(-3).reverse()
  const go = (tpl) => { startWorkout(tpl); navigate('/seance') }

  return (
    <div>
      <PageHeader eyebrow="Entraînement" title="Démarrer une séance" subtitle="Lance un programme, reprends une séance passée ou compose la tienne au fil de l’eau." />
      <div className="grid md:grid-cols-2 gap-4">
        <button onClick={() => go(next.template)} className="group text-left relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary to-[#FF9A3D] text-bg shadow-glow cursor-pointer transition active:scale-[.99] animate-fade-up">
          <Zap size={120} className="absolute -right-6 -bottom-6 opacity-15" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Recommandé · {next.program.name}</span>
          <span className="block font-display text-4xl font-extrabold uppercase mt-1">{next.template.name}</span>
          <span className="block font-medium opacity-80">{next.template.focus} · {next.template.exercises.length} exercices</span>
          <span className="inline-flex items-center gap-2 mt-5 h-11 px-5 rounded-xl bg-bg text-ink font-semibold group-hover:bg-bg/90"><Play size={17} fill="currentColor" aria-hidden="true" /> Commencer</span>
        </button>
        <button onClick={() => go(null)} className="group text-left card p-6 hover:border-primary/60 transition cursor-pointer animate-fade-up" style={{ animationDelay: '60ms' }}>
          <span className="grid place-items-center size-12 rounded-xl bg-raised text-primary"><Plus size={24} aria-hidden="true" /></span>
          <span className="block font-display text-3xl font-bold uppercase mt-4">Séance libre</span>
          <span className="block text-muted">Ajoute les exercices au fur et à mesure.</span>
        </button>
      </div>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold uppercase mb-3">Refaire une séance récente</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map((w) => (
              <Card key={w.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl font-bold uppercase truncate">{w.name}</div>
                  <div className="text-sm text-muted">{relDay(w.startedAt)} · {w.exercises.length} exos · {fmtDuration(w.duration)}</div>
                </div>
                <button className="btn-ghost btn-sm" onClick={() => { repeatWorkout(w.id); navigate('/seance') }}><RotateCcw size={15} aria-hidden="true" />Refaire</button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold uppercase">Modèles</h2>
          <Link to="/programmes" className="text-sm font-semibold text-primary hover:underline cursor-pointer">Gérer les programmes</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...templates.map((t) => ({ ...t, programName: 'Mes modèles' })), ...PROGRAMS.flatMap((p) => p.days.map((d) => ({ ...d, programId: p.id, programName: p.name })))].map((t) => (
            <button key={t.id} onClick={() => go(t)} className="text-left card p-4 hover:border-primary/60 transition cursor-pointer group">
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow truncate">{t.programName}</span>
                <Play size={16} className="text-faint group-hover:text-primary transition shrink-0" aria-hidden="true" />
              </div>
              <div className="font-display text-xl font-bold uppercase mt-1">{t.name}</div>
              <div className="text-sm text-muted truncate">{t.focus || t.exercises.map((e) => EX_BY_ID[e.exId]?.name).join(', ')}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

// ───────────────────────────────── Active workout
function ActiveWorkout() {
  const s = useStore()
  const { active, profile, workouts, settings } = s
  const navigate = useNavigate()
  const elapsed = useElapsed(active.startedAt)
  useWakeLock(true) // screen stays on while a workout is running
  const [picker, setPicker] = useState(false)
  const [detail, setDetail] = useState(null)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const kcal = workoutCalories(active, profile.weight, elapsed)
  const records = useMemo(() => computeRecords(workouts), [workouts])
  const [celebration, setCelebration] = useState(null)

  // a set is being validated: is it a new personal record (vs history AND this session)?
  const onSetDone = (we, st) => {
    const ex = EX_BY_ID[we.exId]
    const rec = records[we.exId]
    if (!rec || st.warmup) return // first time on this exercise: that's a baseline, not a record
    const others = we.sets.filter((x) => x.done && !x.warmup && x.id !== st.id)
    let gain = null
    if (+st.kg > 0 && +st.reps > 0) {
      const v = e1rm(+st.kg, +st.reps)
      const best = Math.max(rec.e1rm || 0, ...others.map((x) => e1rm(+x.kg, +x.reps)))
      if (best > 0 && v > best * 1.005) gain = { label: '1RM estimé', value: `${fmt(v, 1)} kg`, delta: `+${fmt(v - best, 1)} kg`, detail: `${st.kg} kg × ${st.reps}` }
    } else if (ex.type === 'bodyweight' && +st.reps > 0) {
      const best = Math.max(rec.reps || 0, ...others.map((x) => +x.reps || 0))
      if (best > 0 && +st.reps > best) gain = { label: 'Répétitions', value: `${st.reps} reps`, delta: `+${st.reps - best}`, detail: 'au poids du corps' }
    } else if (ex.type === 'time' && +st.sec > 0) {
      const best = Math.max(rec.sec || 0, ...others.map((x) => +x.sec || 0))
      if (best > 0 && +st.sec > best) gain = { label: 'Temps', value: `${st.sec} s`, delta: `+${st.sec - best} s`, detail: 'tenue' }
    }
    if (gain) setCelebration({ id: Date.now(), exercise: ex.name, ...gain })
  }
  const totals = useMemo(() => {
    let done = 0, total = 0, vol = 0
    for (const we of active.exercises) {
      const ex = EX_BY_ID[we.exId]
      for (const st of we.sets) { total++; if (st.done) done++; vol += setVolume(st, ex) }
    }
    return { done, total, vol }
  }, [active])

  const finish = () => {
    const id = s.finishWorkout()
    setConfirmFinish(false)
    if (id) navigate(`/historique/${id}?bilan=1`)
  }

  return (
    <div className="pb-28">
      {/* Sticky session header */}
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] lg:top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 bg-bg/85 backdrop-blur-xl border-b border-line/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-success flex items-center gap-2"><span className="size-2 rounded-full bg-success animate-pulse" />En cours</p>
            <input
              value={active.name} onChange={(e) => s.renameActive(e.target.value)} aria-label="Nom de la séance"
              className="w-full bg-transparent font-display text-3xl sm:text-4xl font-bold uppercase outline-none focus:text-primary truncate"
            />
          </div>
          <button className="btn-ghost size-11 rounded-xl" onClick={() => setConfirmDiscard(true)} aria-label="Abandonner la séance"><X size={18} /></button>
          <button className="btn-primary btn-md" onClick={() => setConfirmFinish(true)}><Flag size={17} aria-hidden="true" /><span className="hidden sm:inline">Terminer</span></button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { icon: Timer, label: 'Durée', value: fmtClock(elapsed) },
            { icon: Flame, label: 'Calories', value: `${fmt(kcal)}` },
            { icon: ListChecks, label: 'Séries', value: `${totals.done}/${totals.total}` },
            { icon: Dumbbell, label: 'Volume', value: fmtKg(totals.vol) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-surface border border-line px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted font-semibold"><m.icon size={12} aria-hidden="true" />{m.label}</div>
              <div className="font-display text-xl sm:text-2xl font-bold tabular leading-tight">{m.value}</div>
            </div>
          ))}
        </div>
        <div className="h-1 rounded-full bg-raised mt-3 overflow-hidden">
          <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${totals.total ? (totals.done / totals.total) * 100 : 0}%` }} />
        </div>
      </div>

      {active.exercises.length === 0 && (
        <Card><EmptyState icon={Dumbbell} title="Séance vide" text="Ajoute ton premier exercice pour commencer à enregistrer tes séries." action={<button className="btn-primary btn-md" onClick={() => setPicker(true)}><Plus size={18} aria-hidden="true" />Ajouter un exercice</button>} /></Card>
      )}

      <div className="space-y-4">
        {active.exercises.map((we, i) => (
          <ExerciseBlock key={we.id} we={we} index={i} count={active.exercises.length} history={workouts} onInfo={() => setDetail(we.exId)} onSetDone={onSetDone} />
        ))}
      </div>

      {active.exercises.length > 0 && (
        <button className="btn-outline btn-lg w-full mt-4 border-dashed" onClick={() => setPicker(true)}><Plus size={18} aria-hidden="true" />Ajouter un exercice</button>
      )}

      <RestTimer active={active} setRest={s.setRest} sound={settings.sound} />
      <PRCelebration data={celebration} sound={settings.sound} onDone={() => setCelebration(null)} />

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={(ids) => s.addExercises(ids)} />
      <ExerciseDetail exId={detail} onClose={() => setDetail(null)} />

      <Modal open={confirmFinish} onClose={() => setConfirmFinish(false)} title="Terminer la séance ?" size="sm"
        footer={<>
          <button className="btn-ghost btn-md" onClick={() => setConfirmFinish(false)}>Continuer</button>
          <button className="btn-primary btn-md" onClick={finish} disabled={!totals.done}><Flag size={17} aria-hidden="true" />Terminer</button>
        </>}>
        {totals.done ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-raised p-3"><div className="font-display text-2xl font-bold tabular">{fmtClock(elapsed)}</div><div className="text-xs text-muted">durée</div></div>
              <div className="rounded-xl bg-raised p-3"><div className="font-display text-2xl font-bold tabular">{fmt(kcal)}</div><div className="text-xs text-muted">kcal</div></div>
              <div className="rounded-xl bg-raised p-3"><div className="font-display text-2xl font-bold tabular">{totals.done}</div><div className="text-xs text-muted">séries</div></div>
            </div>
            {totals.total > totals.done && <p className="text-sm text-warning">{totals.total - totals.done} série{totals.total - totals.done > 1 ? 's' : ''} non validée{totals.total - totals.done > 1 ? 's' : ''} ne ser{totals.total - totals.done > 1 ? 'ont' : 'a'} pas enregistrée{totals.total - totals.done > 1 ? 's' : ''}.</p>}
          </div>
        ) : <p className="text-muted">Valide au moins une série (bouton ✓) avant de terminer la séance.</p>}
      </Modal>

      <Modal open={confirmDiscard} onClose={() => setConfirmDiscard(false)} title="Abandonner la séance ?" size="sm"
        footer={<>
          <button className="btn-ghost btn-md" onClick={() => setConfirmDiscard(false)}>Annuler</button>
          <button className="btn-danger btn-md" onClick={() => { s.discardWorkout(); setConfirmDiscard(false) }}><Trash2 size={17} aria-hidden="true" />Abandonner</button>
        </>}>
        <p className="text-muted">Toutes les séries de cette séance seront perdues. Cette action est irréversible.</p>
      </Modal>
    </div>
  )
}

function ExerciseBlock({ we, index, count, history, onInfo, onSetDone }) {
  const s = useStore()
  const ex = EX_BY_ID[we.exId]
  const prev = useMemo(() => lastPerformance(history, we.exId), [history, we.exId])
  const [noteOpen, setNoteOpen] = useState(!!we.note)
  const [menu, setMenu] = useState(false)
  const allDone = we.sets.length > 0 && we.sets.every((x) => x.done)
  const suggestion = useMemo(() => suggestProgression(ex, prev, we.target), [ex, prev, we.target])
  const pending = we.sets.filter((x) => !x.done && !x.warmup)
  const applied = suggestion && pending.length > 0 && pending.every((x) =>
    suggestion.sec != null ? +x.sec === suggestion.sec : (suggestion.kg == null || +x.kg === suggestion.kg) && (suggestion.reps == null || +x.reps === suggestion.reps))
  const applySuggestion = () => pending.forEach((x) => s.updateSet(we.id, x.id,
    suggestion.sec != null ? { sec: suggestion.sec } : { ...(suggestion.kg != null ? { kg: suggestion.kg } : {}), ...(suggestion.reps != null ? { reps: suggestion.reps } : {}) }))

  const cols = ex.type === 'cardio' ? ['Série', 'Minutes', 'Km', ''] :
    ex.type === 'time' ? ['Série', 'Précédent', 'Secondes', ''] :
      ex.type === 'bodyweight' ? ['Série', 'Précédent', '+kg', 'Reps', ''] : ['Série', 'Précédent', 'kg', 'Reps', '']
  const grid = cols.length === 5
    ? 'grid-cols-[34px_minmax(0,1fr)_minmax(0,76px)_minmax(0,64px)_42px] sm:grid-cols-[44px_1fr_minmax(0,84px)_minmax(0,84px)_48px] gap-1.5 sm:gap-2'
    : 'grid-cols-[34px_minmax(0,1fr)_minmax(0,110px)_42px] sm:grid-cols-[44px_1fr_minmax(0,110px)_48px] gap-1.5 sm:gap-2'
  const prevLabel = (p) => !p ? '—' : ex.type === 'time' ? `${p.sec}s` : ex.type === 'cardio' ? `${p.min} min` : p.kg ? `${p.kg} × ${p.reps}` : `${p.reps} reps`

  return (
    <Card className={`overflow-hidden transition ${allDone ? 'border-success/40' : ''} animate-fade-up`} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className={`grid place-items-center size-10 rounded-xl font-display text-lg font-bold shrink-0 ${allDone ? 'bg-success text-bg' : 'bg-raised text-primary'}`}>
          {allDone ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : index + 1}
        </span>
        <button onClick={onInfo} className="flex-1 min-w-0 text-left cursor-pointer group">
          <span className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold uppercase leading-tight group-hover:text-primary transition truncate">{ex.name}</span>
            <Info size={15} className="text-faint shrink-0" aria-hidden="true" />
          </span>
          <span className="block text-sm text-muted truncate">
            {ex.primary.map((m) => MUSCLES[m]).join(', ')}
            {we.target && <> · objectif <span className="text-ink">{we.target}{ex.type === 'time' ? ' s' : ex.type === 'cardio' ? ' min' : ' reps'}</span></>}
            {we.rest && ex.type !== 'cardio' && <> · repos {we.rest}s</>}
          </span>
        </button>
        <div className="relative">
          <button className="btn-ghost size-10 rounded-xl" onClick={() => setMenu(!menu)} aria-label="Options de l’exercice" aria-expanded={menu}><MoreHorizontal size={18} /></button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-11 z-20 w-52 p-1.5 rounded-xl bg-raised border border-line shadow-2xl animate-scale-in">
                {[
                  { icon: ChevronUp, label: 'Monter', fn: () => s.moveExercise(we.id, -1), disabled: index === 0 },
                  { icon: ChevronDown, label: 'Descendre', fn: () => s.moveExercise(we.id, 1), disabled: index === count - 1 },
                  { icon: StickyNote, label: noteOpen ? 'Masquer la note' : 'Ajouter une note', fn: () => setNoteOpen(!noteOpen) },
                  { icon: Trash2, label: 'Retirer l’exercice', fn: () => s.removeExercise(we.id), danger: true },
                ].map((m) => (
                  <button key={m.label} disabled={m.disabled} onClick={() => { m.fn(); setMenu(false) }}
                    className={`w-full flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-40 ${m.danger ? 'text-danger hover:bg-danger/10' : 'hover:bg-line'}`}>
                    <m.icon size={16} aria-hidden="true" />{m.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {suggestion && !allDone && (
        <div className={`mx-4 mb-3 flex items-center gap-3 p-3 rounded-xl border ${suggestion.kind === 'up' ? 'border-success/40 bg-success/10' : 'border-line bg-raised/50'}`}>
          <span className={`grid place-items-center size-9 rounded-lg shrink-0 ${suggestion.kind === 'up' ? 'bg-success text-bg' : 'bg-primary/15 text-primary'}`}><TrendingUp size={17} aria-hidden="true" /></span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">
              Objectif du jour : <span className="tabular">{suggestion.sec != null ? `${suggestion.sec} s` : `${suggestion.kg ? `${fmt(suggestion.kg, 2)} kg × ` : ''}${suggestion.reps} reps`}</span>
              <span className={`ml-1.5 text-xs font-bold ${suggestion.kind === 'up' ? 'text-success' : 'text-primary'}`}>{suggestion.delta}</span>
            </div>
            <div className="text-xs text-muted truncate" title={suggestion.reason}>{suggestion.reason}</div>
          </div>
          {pending.length > 0 && (applied
            ? <span className="text-xs font-semibold text-success shrink-0 flex items-center gap-1"><Check size={14} aria-hidden="true" />Appliqué</span>
            : <button className="btn-ghost btn-sm shrink-0" onClick={applySuggestion}><Wand2 size={14} aria-hidden="true" />Appliquer</button>)}
        </div>
      )}

      {noteOpen && (
        <div className="px-4 pb-3">
          <textarea value={we.note} onChange={(e) => s.setNote(we.id, e.target.value)} rows={2} placeholder="Ressenti, réglage machine, douleur…"
            className="input h-auto py-2 resize-none text-sm" aria-label="Note de l’exercice" />
        </div>
      )}

      <div className="px-2 sm:px-4 pb-3">
        <div className={`grid ${grid} px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-faint`}>
          {cols.map((c, i) => <span key={i} className={i > 1 ? 'text-center' : ''}>{c}</span>)}
        </div>
        <ul className="space-y-1.5">
          {we.sets.map((st, i) => {
            let n = 0
            for (let k = 0; k <= i; k++) if (!we.sets[k].warmup) n++
            const p = prev?.[i]
            return (
              <li key={st.id} className={`group grid ${grid} items-center px-1.5 sm:px-2 py-1.5 rounded-xl transition ${st.done ? 'bg-success/12' : 'bg-raised/40'}`}>
                <button
                  onClick={() => s.updateSet(we.id, st.id, { warmup: !st.warmup })}
                  className={`h-9 rounded-lg font-display text-lg font-bold cursor-pointer ${st.warmup ? 'text-warning bg-warning/10' : 'text-ink hover:bg-line'}`}
                  aria-label={st.warmup ? 'Série d’échauffement (cliquer pour passer en série de travail)' : `Série ${n} (cliquer pour marquer en échauffement)`}
                  title="Échauffement / série de travail"
                >{st.warmup ? 'É' : n}</button>

                {ex.type === 'cardio' ? (
                  <>
                    <NumInput value={st.min} onChange={(v) => s.updateSet(we.id, st.id, { min: v })} label="Minutes" done={st.done} />
                    <NumInput value={st.km} onChange={(v) => s.updateSet(we.id, st.id, { km: v })} label="Kilomètres" done={st.done} step="0.1" />
                  </>
                ) : (
                  <>
                    <button className="text-sm text-muted tabular text-left truncate hover:text-ink cursor-pointer disabled:cursor-default" disabled={!p}
                      onClick={() => p && s.updateSet(we.id, st.id, ex.type === 'time' ? { sec: p.sec } : { kg: p.kg, reps: p.reps })}
                      title={p ? 'Reprendre la performance précédente' : undefined}>{prevLabel(p)}</button>
                    {ex.type === 'time' ? (
                      <NumInput value={st.sec} onChange={(v) => s.updateSet(we.id, st.id, { sec: v })} label="Secondes" done={st.done} />
                    ) : (
                      <>
                        <NumInput value={st.kg} onChange={(v) => s.updateSet(we.id, st.id, { kg: v })} label="Charge en kg" done={st.done} step="0.25" placeholder={ex.type === 'bodyweight' ? '0' : ''} />
                        <NumInput value={st.reps} onChange={(v) => s.updateSet(we.id, st.id, { reps: v })} label="Répétitions" done={st.done} />
                      </>
                    )}
                  </>
                )}

                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => { if (!st.done) onSetDone?.(we, st); s.toggleSet(we.id, st.id) }} aria-pressed={st.done} aria-label={st.done ? 'Annuler la validation' : 'Valider la série'}
                    className={`grid place-items-center size-10 rounded-xl transition cursor-pointer ${st.done ? 'bg-success text-bg animate-pop' : 'bg-line text-muted hover:bg-faint/40 hover:text-ink'}`}
                  ><Check size={18} strokeWidth={3} /></button>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex gap-2 mt-2 px-2">
          <button className="btn-ghost btn-sm flex-1" onClick={() => s.addSet(we.id)}><Plus size={15} aria-hidden="true" />Ajouter une série</button>
          {we.sets.length > 0 && !we.sets[we.sets.length - 1].done && (
            <button className="btn-ghost btn-sm" onClick={() => s.removeSet(we.id, we.sets[we.sets.length - 1].id)} aria-label="Supprimer la dernière série"><Trash2 size={15} /></button>
          )}
        </div>
      </div>
    </Card>
  )
}

function NumInput({ value, onChange, label, done, step = '1', placeholder }) {
  return (
    <input
      type="number" inputMode="decimal" step={step} min="0" value={value ?? ''} placeholder={placeholder} aria-label={label}
      onChange={(e) => onChange(e.target.value === '' ? '' : +e.target.value)}
      onFocus={(e) => e.target.select()}
      className={`h-10 w-full min-w-0 rounded-lg text-center font-semibold tabular outline-none border transition focus:border-primary focus:ring-2 focus:ring-primary/30 ${done ? 'bg-transparent border-transparent text-success' : 'bg-bg/60 border-line'}`}
    />
  )
}

function RestTimer({ active, setRest, sound }) {
  const [now, setNow] = useState(Date.now())
  const fired = useRef(null)
  const ends = active.restEndsAt
  useEffect(() => {
    if (!ends) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [ends])
  const left = ends ? Math.ceil((ends - now) / 1000) : 0
  useEffect(() => {
    if (ends && left <= 0 && fired.current !== ends) {
      fired.current = ends
      if (sound) beep()
      setTimeout(() => setRest(null), 1600)
    }
  }, [left, ends, sound, setRest])
  if (!ends) return null
  const total = active.restTotal || 90
  const pct = Math.max(0, Math.min(1, left / total))
  const over = left <= 0

  return (
    <div className="fixed z-40 left-3 right-3 bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-6 lg:left-[calc(260px+2.5rem)] lg:right-10 animate-fade-up" role="timer" aria-live="polite">
      <div className={`relative overflow-hidden rounded-2xl border shadow-2xl ${over ? 'bg-success text-bg border-success' : 'bg-surface border-line'}`}>
        {!over && <div className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-300 ease-linear" style={{ width: `${pct * 100}%` }} />}
        <div className="relative flex items-center gap-3 p-3">
          <span className={`grid place-items-center size-11 rounded-xl ${over ? 'bg-bg/15' : 'bg-primary/15 text-primary'}`}><Timer size={20} aria-hidden="true" /></span>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold uppercase tracking-wider ${over ? '' : 'text-muted'}`}>{over ? 'C’est reparti !' : 'Repos'}</div>
            <div className="font-display text-3xl font-bold tabular leading-none">{over ? 'Série suivante' : fmtClock(left)}</div>
          </div>
          {!over && (
            <>
              <button className="btn-ghost btn-sm" onClick={() => setRest(Math.max(Date.now() + 1000, ends - 15000))} aria-label="Retirer 15 secondes">−15</button>
              <button className="btn-ghost btn-sm" onClick={() => setRest(ends + 15000, total + 15)} aria-label="Ajouter 15 secondes">+15</button>
              <button className="btn-primary btn-sm" onClick={() => setRest(null)}>Passer</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
