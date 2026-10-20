import { useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Flame, Dumbbell, Clock, Trophy, RotateCcw, Save, Trash2, ListChecks, PartyPopper, Sparkles, CloudUpload, CheckCircle2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, CardHeader, Modal, StatTile, EmptyState } from '../components/ui'
import BodyMap from '../components/BodyMap'
import { EX_BY_ID, MUSCLES } from '../data/exercises'
import { fmt, fmtKg, fmtDuration, fmtDate, workoutStats, e1rm, xpInfo } from '../lib/calc'
import { prValue } from './Dashboard'
import BackupButton from '../components/BackupButton'

export default function WorkoutDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { workouts, profile, deleteWorkout, repeatWorkout, saveTemplate, active, settings } = useStore()
  const [backedUp, setBackedUp] = useState(false)
  const w = workouts.find((x) => x.id === id)
  const [confirm, setConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const stats = useMemo(() => (w ? workoutStats(w, profile.weight) : null), [w, profile.weight])

  if (!w) return <Card><EmptyState icon={ListChecks} title="Séance introuvable" text="Elle a peut-être été supprimée." action={<Link to="/historique" className="btn-primary btn-md">Retour à l’historique</Link>} /></Card>

  const bilan = params.get('bilan') === '1'
  const maxM = Math.max(1, ...Object.values(stats.muscles))
  const levels = Object.fromEntries(Object.entries(stats.muscles).map(([k, v]) => [k, v / maxM]))
  const topMuscles = Object.entries(stats.muscles).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const xpGain = 100 + Math.round((w.volume || 0) / 100) + (w.prs?.length || 0) * 50
  const xp = xpInfo(workouts)
  const prByEx = Object.fromEntries((w.prs || []).map((p) => [p.exId, p]))

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn-ghost btn-sm mb-4"><ArrowLeft size={16} aria-hidden="true" />Retour</button>

      {bilan && (
        <section className="relative overflow-hidden rounded-2xl border border-success/40 bg-gradient-to-br from-success/25 via-surface to-surface p-6 sm:p-8 mb-6 animate-scale-in">
          <PartyPopper size={140} className="absolute -right-6 -top-6 text-success/10" aria-hidden="true" />
          <p className="eyebrow text-success">Séance terminée</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold uppercase mt-1">Bien joué, {profile.name} !</h1>
          <p className="text-muted mt-2">
            {w.prs?.length ? `${w.prs.length} nouveau${w.prs.length > 1 ? 'x' : ''} record${w.prs.length > 1 ? 's' : ''} personnel${w.prs.length > 1 ? 's' : ''}. Tu progresses.` : 'Une séance de plus au compteur. La régularité paie toujours.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/15 text-warning font-semibold"><Sparkles size={16} aria-hidden="true" />+{fmt(xpGain)} XP</span>
            <span className="text-sm text-muted">Niveau {xp.level} · {xp.title} · {fmt(xp.toNext)} XP avant le prochain niveau</span>
          </div>
          {settings.backupAfterWorkout !== false && (
            <div className="relative mt-5 pt-5 border-t border-line/70 flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted flex-1 min-w-[200px]">{backedUp ? 'Sauvegarde faite, ta séance est en sécurité.' : 'Ta séance est enregistrée sur ton téléphone. Une copie dans iCloud la met à l’abri.'}</p>
              {backedUp
                ? <span className="flex items-center gap-1.5 text-success text-sm font-semibold"><CheckCircle2 size={16} aria-hidden="true" />Sauvegardé</span>
                : <BackupButton className="btn-outline btn-sm" onDone={() => setBackedUp(true)} />}
            </div>
          )}
        </section>
      )}

      {!bilan && (
        <header className="mb-6 animate-fade-up">
          <p className="eyebrow mb-1">{fmtDate(w.startedAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {new Date(w.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <h1 className="text-4xl sm:text-5xl font-bold uppercase leading-none">{w.name}</h1>
        </header>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile icon={Clock} label="Durée" value={fmtDuration(w.duration)} tone="info" />
        <StatTile icon={Flame} label="Calories estimées" value={fmt(w.calories)} unit="kcal" />
        <StatTile icon={Dumbbell} label="Volume" value={fmtKg(w.volume)} tone="success" />
        <StatTile icon={Trophy} label="Records" value={w.prs?.length || 0} sub={`${stats.sets} séries · ${fmt(stats.reps)} reps`} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
        <div className="space-y-3">
          {w.exercises.map((we) => {
            const ex = EX_BY_ID[we.exId]
            if (!ex) return null
            const best = we.sets.reduce((b, s) => (e1rm(+s.kg, +s.reps) > e1rm(+b?.kg, +b?.reps) ? s : b), null)
            const pr = prByEx[we.exId]
            return (
              <Card key={we.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-bold uppercase leading-tight">{ex.name}</h3>
                    <p className="text-sm text-muted">{ex.primary.map((m) => MUSCLES[m]).join(', ')}</p>
                  </div>
                  {pr && <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/15 text-warning text-xs font-bold shrink-0"><Trophy size={13} aria-hidden="true" />Record · {prValue(pr)}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {we.sets.map((s, i) => (
                    <span key={s.id || i} className={`px-3 py-1.5 rounded-lg text-sm tabular font-medium ${s.warmup ? 'bg-warning/10 text-warning' : best === s && ex.type === 'weight' ? 'bg-primary/15 text-primary' : 'bg-raised'}`}>
                      {ex.type === 'cardio' ? `${s.min} min${s.km ? ` · ${s.km} km` : ''}` : ex.type === 'time' ? `${s.sec} s` : s.kg ? `${s.kg} kg × ${s.reps}` : `${s.reps} reps`}
                    </span>
                  ))}
                </div>
                {best && ex.type === 'weight' && <p className="text-xs text-muted mt-2">1RM estimé sur la meilleure série : <span className="text-ink font-semibold">{fmt(e1rm(+best.kg, +best.reps), 1)} kg</span></p>}
                {we.note && <p className="text-sm text-muted mt-2 italic">« {we.note} »</p>}
              </Card>
            )
          })}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <Card className="p-5">
            <CardHeader title="Muscles travaillés" />
            <BodyMap levels={levels} />
            <ul className="mt-4 space-y-2">
              {topMuscles.map(([m, v]) => (
                <li key={m} className="text-sm">
                  <div className="flex justify-between mb-1"><span>{MUSCLES[m]}</span><span className="text-muted tabular">{fmt(v, 1)} séries</span></div>
                  <div className="h-1.5 rounded-full bg-raised"><div className="h-full rounded-full bg-primary" style={{ width: `${(v / maxM) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 space-y-2">
            <button className="btn-primary btn-md w-full" disabled={!!active} onClick={() => { repeatWorkout(w.id); navigate('/seance') }}><RotateCcw size={17} aria-hidden="true" />Refaire cette séance</button>
            <button className="btn-ghost btn-md w-full" disabled={saved} onClick={() => {
              saveTemplate({ name: w.name, focus: '', exercises: w.exercises.map((e) => ({ exId: e.exId, sets: e.sets.length, reps: e.target || String(e.sets[0]?.reps || e.sets[0]?.sec || e.sets[0]?.min || 10), rest: e.rest || 90 })) })
              setSaved(true)
            }}><Save size={17} aria-hidden="true" />{saved ? 'Modèle enregistré' : 'Enregistrer comme modèle'}</button>
            <button className="btn-danger btn-md w-full" onClick={() => setConfirm(true)}><Trash2 size={17} aria-hidden="true" />Supprimer</button>
          </Card>
        </div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Supprimer la séance ?" size="sm"
        footer={<><button className="btn-ghost btn-md" onClick={() => setConfirm(false)}>Annuler</button><button className="btn-danger btn-md" onClick={() => { deleteWorkout(w.id); navigate('/historique', { replace: true }) }}>Supprimer</button></>}>
        <p className="text-muted">Cette séance et ses statistiques seront définitivement supprimées.</p>
      </Modal>
    </div>
  )
}
