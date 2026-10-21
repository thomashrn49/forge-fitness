import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Plus, Play, Lightbulb, Flame, Trophy, Dumbbell, AlertTriangle, Target, Shuffle, Tag } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Modal, LevelDots, ChartTooltip } from './ui'
import BodyMap from './BodyMap'
import ExerciseDemo from './ExerciseDemo'
import { hasDemo } from '../data/demos'
import { EX_BY_ID, EXERCISES, MUSCLES, LEVELS } from '../data/exercises'
import { useStore } from '../lib/store'
import { e1rm, fmt, fmtDate, isDone } from '../lib/calc'

export function exerciseHistory(workouts, exId) {
  const ex = EX_BY_ID[exId]
  const pts = []
  for (const w of workouts) {
    const we = w.exercises.find((e) => e.exId === exId)
    if (!we) continue
    const sets = we.sets.filter(isDone)
    if (!sets.length) continue
    let best = 0, top = null, reps = 0, sec = 0, min = 0, vol = 0
    for (const s of sets) {
      const v = e1rm(+s.kg, +s.reps)
      if (v > best) { best = v; top = s }
      reps = Math.max(reps, +s.reps || 0)
      sec = Math.max(sec, +s.sec || 0)
      min += +s.min || 0
      vol += (+s.kg || 0) * (+s.reps || 0)
    }
    const value = ex.type === 'cardio' ? min : ex.type === 'time' ? sec : best || reps
    pts.push({ date: w.startedAt, value: Math.round(value * 10) / 10, top, sets, vol, workoutId: w.id })
  }
  return pts
}

const GOAL_LABEL = { strength: 'Force', muscle: 'Prise de muscle', lose: 'Perte de gras', maintain: 'Forme' }

// sets x reps x rest recommendation for the user's goal
export function prescription(ex, goal = 'maintain') {
  if (ex.cat === 'mobility') return { sets: '2–3', reps: '30–45 s', rest: 'Aucun', note: 'De chaque côté, sans à-coups. Idéal en fin de séance ou les jours off.' }
  if (ex.type === 'cardio') return goal === 'lose'
    ? { sets: '1', reps: '30–45 min', rest: 'Zone 2', note: 'Allure où tu peux encore parler, ou 15–20 min de fractionné 2 fois par semaine.' }
    : { sets: '1', reps: '20–30 min', rest: 'Modérée', note: 'Allure modérée et régulière.' }
  if (ex.type === 'time') return { sets: '3', reps: goal === 'strength' ? '20–40 s' : '30–60 s', rest: '45 s', note: 'Ajoute 5 à 10 secondes chaque semaine.' }
  const isolation = ex.primary.length === 1 && ex.secondary.length <= 1 && ex.met < 5
  const t = {
    strength: isolation ? { sets: '3', reps: '6–8', rest: '90 s' } : { sets: '4–5', reps: '3–6', rest: '2–3 min' },
    muscle: isolation ? { sets: '3', reps: '10–15', rest: '60 s' } : { sets: '3–4', reps: '8–12', rest: '90 s' },
    lose: { sets: '3', reps: '12–15', rest: '45–60 s' },
    maintain: { sets: '3', reps: '10–12', rest: '60–90 s' },
  }[goal] || { sets: '3', reps: '10–12', rest: '60–90 s' }
  const note = goal === 'strength' && !isolation ? 'Charge lourde, garde 1 à 2 répétitions en réserve.'
    : goal === 'lose' ? 'Enchaîne en circuit pour garder le cardio élevé.'
      : 'Termine chaque série à 1 ou 2 répétitions de l’échec.'
  return { ...t, note }
}

// exercises that train the same main muscle, favouring other equipment
export function alternativesFor(ex, n = 6) {
  return EXERCISES.filter((o) => o.id !== ex.id && o.cat !== 'mobility' && o.primary.some((m) => ex.primary.includes(m)))
    .map((o) => ({ o, s: o.primary.filter((m) => ex.primary.includes(m)).length * 2 + (o.equipment !== ex.equipment ? 1 : 0) + (o.type === ex.type ? 1 : 0) }))
    .sort((a, b) => b.s - a.s || a.o.name.localeCompare(b.o.name, 'fr'))
    .slice(0, n).map((x) => x.o)
}

export function metricLabel(ex) {
  if (ex.type === 'cardio') return { name: 'Durée', unit: 'min' }
  if (ex.type === 'time') return { name: 'Meilleur temps', unit: 's' }
  if (ex.type === 'bodyweight') return { name: 'Max répétitions', unit: 'reps' }
  return { name: '1RM estimé', unit: 'kg' }
}

export default function ExerciseDetail({ exId, onClose }) {
  const [cur, setCur] = useState(exId)
  useEffect(() => setCur(exId), [exId])
  // switching to an alternative: back to the top of the sheet
  useEffect(() => { document.querySelector('[role=dialog] .overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' }) }, [cur])
  const ex = exId && cur ? EX_BY_ID[cur] : null
  const { workouts, favorites, toggleFavorite, active, addExercises, startWorkout, profile } = useStore()
  const navigate = useNavigate()
  const history = useMemo(() => (ex ? exerciseHistory(workouts, ex.id) : []), [workouts, ex])
  if (!ex) return null
  const fav = favorites.includes(ex.id)
  const metric = metricLabel(ex)
  const best = history.reduce((m, p) => Math.max(m, p.value), 0)
  const kcal10 = Math.round(ex.met * (profile?.weight || 75) * (10 / 60))
  const presc = prescription(ex, profile?.goal)
  const alts = alternativesFor(ex)

  const add = () => {
    if (!active) startWorkout()
    addExercises([ex.id])
    onClose()
    navigate('/seance')
  }

  return (
    <Modal
      open={!!ex} onClose={onClose} title={ex.name} size="lg"
      footer={
        <>
          <button className="btn-ghost btn-md" onClick={() => toggleFavorite(ex.id)} aria-pressed={fav}>
            <Star size={18} className={fav ? 'fill-primary text-primary' : ''} aria-hidden="true" />
            {fav ? 'Favori' : 'Ajouter aux favoris'}
          </button>
          <button className="btn-primary btn-md" onClick={add}>
            {active ? <Plus size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {active ? 'Ajouter à la séance' : 'Démarrer avec cet exercice'}
          </button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2 mb-5 -mt-1">
        <span className="chip-on pointer-events-none">{ex.primary.map((m) => MUSCLES[m]).join(' · ')}</span>
        <span className="chip-off pointer-events-none"><Dumbbell size={14} aria-hidden="true" />{ex.equipment}</span>
        <span className="chip-off pointer-events-none gap-2"><LevelDots level={ex.level} />{LEVELS[ex.level]}</span>
        <span className="chip-off pointer-events-none"><Flame size={14} aria-hidden="true" />≈ {kcal10} kcal / 10 min</span>
      </div>

      {ex.aliases?.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted -mt-2 mb-5">
          <Tag size={14} aria-hidden="true" />Aussi appelé : {ex.aliases.slice(0, 5).map((a) => <span key={a} className="px-2 py-0.5 rounded-md bg-raised text-ink">{a}</span>)}
        </p>
      )}

      <ExerciseDemo exId={ex.id} name={ex.name} className="mb-6" />

      <div className="grid md:grid-cols-[minmax(0,240px)_1fr] gap-6">
        <div className="card p-4 bg-raised/40">
          <BodyMap primary={ex.primary} secondary={ex.secondary} />
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" />Principal</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/50" />Secondaire</span>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold uppercase mb-3">Exécution</h3>
          <ol className="space-y-3">
            {ex.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid place-items-center size-7 rounded-full bg-primary/15 text-primary font-display font-bold shrink-0">{i + 1}</span>
                <p className="text-[15px] leading-relaxed pt-0.5">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex gap-3 p-3 rounded-xl bg-warning/10 border border-warning/25">
            <Lightbulb size={18} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[15px]"><span className="font-semibold">Conseil du coach : </span>{ex.tip}</p>
          </div>
          {ex.mistakes?.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-danger/10 border border-danger/25">
              <p className="flex items-center gap-2 font-semibold text-[15px]"><AlertTriangle size={16} className="text-danger" aria-hidden="true" />Erreurs à éviter</p>
              <ul className="mt-1.5 space-y-1 text-[15px]">
                {ex.mistakes.map((m) => <li key={m} className="flex gap-2"><span className="text-danger" aria-hidden="true">✕</span>{m}</li>)}
              </ul>
            </div>
          )}
          {ex.secondary.length > 0 && (
            <p className="text-sm text-muted mt-3">Muscles secondaires : {ex.secondary.map((m) => MUSCLES[m]).join(', ')}</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold uppercase flex items-center gap-2"><Target size={18} className="text-primary" aria-hidden="true" />Conseillé pour toi</h3>
          <span className="text-xs font-semibold text-primary">Objectif : {GOAL_LABEL[profile?.goal] || 'Forme'}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Séries', presc.sets], [ex.type === 'cardio' || ex.type === 'time' || ex.cat === 'mobility' ? 'Durée' : 'Répétitions', presc.reps], [ex.type === 'cardio' ? 'Intensité' : 'Repos', presc.rest]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-bg/50 p-2.5">
              <div className="font-display text-2xl font-bold tabular leading-tight">{v}</div>
              <div className="text-xs text-muted">{l}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-2.5">{presc.note}</p>
      </div>

      {alts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold uppercase mb-3 flex items-center gap-2"><Shuffle size={18} className="text-primary" aria-hidden="true" />Alternatives</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {alts.map((a) => (
              <button key={a.id} onClick={() => setCur(a.id)} className="flex items-center gap-3 p-3 rounded-xl bg-raised/50 border border-line hover:border-primary/50 text-left transition cursor-pointer">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate">{a.name}</span>
                  <span className="block text-xs text-muted truncate">{a.primary.map((m) => MUSCLES[m]).join(', ')} · {a.equipment}</span>
                </span>
                <LevelDots level={a.level} />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">Machine prise ou matériel absent ? Ces exercices ciblent les mêmes muscles.</p>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold uppercase">Ta progression</h3>
          {best > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Trophy size={16} aria-hidden="true" /> Record : {fmt(best, 1)} {metric.unit}
            </span>
          )}
        </div>
        {history.length >= 2 ? (
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={history} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => fmtDate(d, { day: 'numeric', month: 'short' })} tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip format={(v) => `${fmt(v, 1)} ${metric.unit}`} labelFormat={(d) => fmtDate(d)} />} cursor={{ stroke: 'rgb(var(--faint))' }} />
                <Line type="monotone" dataKey="value" stroke="rgb(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'rgb(var(--primary))', stroke: 'rgb(var(--surface))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted text-sm p-4 rounded-xl bg-raised/50">
            {history.length ? 'Encore une séance pour voir ta courbe de progression.' : 'Tu n’as pas encore fait cet exercice. Ta progression s’affichera ici.'}
          </p>
        )}
        {history.length > 0 && (
          <ul className="mt-3 divide-y divide-line/70">
            {history.slice(-4).reverse().map((p) => (
              <li key={p.workoutId} className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted">{fmtDate(p.date)}</span>
                <span className="tabular font-medium">
                  {p.sets.map((s) => (ex.type === 'cardio' ? `${s.min} min` : ex.type === 'time' ? `${s.sec}s` : s.kg ? `${s.kg}×${s.reps}` : `${s.reps}`)).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasDemo(ex.id) && <p className="text-[11px] text-faint mt-6">Photos de démonstration : Free Exercise DB (domaine public).</p>}
    </Modal>
  )
}
