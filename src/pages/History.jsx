import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, Dumbbell, Clock, Trophy, History as HistoryIcon, Zap } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, Card, EmptyState, StatTile } from '../components/ui'
import { dayKey, fmt, fmtKg, fmtDuration, fmtDate, startOfWeek, addDays } from '../lib/calc'
import { EX_BY_ID } from '../data/exercises'

export default function HistoryPage() {
  const workouts = useStore((s) => s.workouts)
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d })
  const [selected, setSelected] = useState(null)

  const byDay = useMemo(() => {
    const m = {}
    for (const w of workouts) (m[dayKey(w.startedAt)] ||= []).push(w)
    return m
  }, [workouts])

  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const inMonth = workouts.filter((w) => { const d = new Date(w.startedAt); return d >= month && d < monthEnd })
  const gridStart = startOfWeek(month)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const shown = (selected ? byDay[selected] || [] : inMonth).slice().reverse()
  const todayK = dayKey(new Date())

  const shift = (n) => { setSelected(null); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)) }

  return (
    <div>
      <PageHeader eyebrow="Journal" title="Historique" subtitle={`${workouts.length} séances enregistrées depuis le début.`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile icon={Zap} label="Séances ce mois" value={inMonth.length} />
        <StatTile icon={Flame} label="Calories ce mois" value={fmt(inMonth.reduce((a, w) => a + (w.calories || 0), 0))} unit="kcal" />
        <StatTile icon={Clock} label="Temps d’entraînement" value={fmtDuration(inMonth.reduce((a, w) => a + (w.duration || 0), 0))} tone="info" />
        <StatTile icon={Dumbbell} label="Volume ce mois" value={fmtKg(inMonth.reduce((a, w) => a + (w.volume || 0), 0))} tone="success" />
      </div>

      <div className="grid xl:grid-cols-[420px_1fr] gap-4 items-start">
        <Card className="p-5 xl:sticky xl:top-6">
          <div className="flex items-center justify-between mb-4">
            <button className="btn-ghost size-10 rounded-xl" onClick={() => shift(-1)} aria-label="Mois précédent"><ChevronLeft size={18} /></button>
            <h2 className="text-2xl font-bold uppercase capitalize">{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2>
            <button className="btn-ghost size-10 rounded-xl" onClick={() => shift(1)} aria-label="Mois suivant"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-faint mb-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const k = dayKey(d)
              const ws = byDay[k]
              const out = d.getMonth() !== month.getMonth()
              const sel = selected === k
              return (
                <button key={k} disabled={!ws} onClick={() => setSelected(sel ? null : k)} aria-pressed={sel}
                  aria-label={`${fmtDate(d, { day: 'numeric', month: 'long' })}${ws ? ` : ${ws.length} séance(s)` : ''}`}
                  className={`relative aspect-square rounded-xl text-sm font-semibold transition flex flex-col items-center justify-center
                    ${sel ? 'bg-primary text-bg' : ws ? 'bg-primary/15 text-ink hover:bg-primary/25 cursor-pointer' : 'text-muted'}
                    ${out ? 'opacity-30' : ''} ${k === todayK && !sel ? 'ring-1 ring-primary' : ''}`}>
                  {d.getDate()}
                  {ws && <span className={`absolute bottom-1.5 size-1 rounded-full ${sel ? 'bg-bg' : 'bg-primary'}`} />}
                </button>
              )
            })}
          </div>
          {selected && <button className="btn-ghost btn-sm w-full mt-4" onClick={() => setSelected(null)}>Voir tout le mois</button>}
        </Card>

        <div>
          <h2 className="text-xl font-bold uppercase mb-3 text-muted">
            {selected ? fmtDate(selected + 'T00:00', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Séances du mois'}
          </h2>
          {shown.length ? (
            <ul className="space-y-3">
              {shown.map((w, i) => (
                <li key={w.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <Link to={`/historique/${w.id}`} className="group card p-4 sm:p-5 flex gap-4 hover:border-primary/50 transition cursor-pointer">
                    <div className="hidden sm:flex flex-col items-center justify-center w-16 shrink-0 rounded-xl bg-raised">
                      <span className="text-xs uppercase text-muted">{fmtDate(w.startedAt, { weekday: 'short' })}</span>
                      <span className="font-display text-3xl font-bold leading-none">{new Date(w.startedAt).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-display text-2xl font-bold uppercase truncate group-hover:text-primary transition">{w.name}</div>
                          <div className="text-sm text-muted">{fmtDate(w.startedAt, { weekday: 'long', day: 'numeric', month: 'short' })} · {new Date(w.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        {w.prs?.length > 0 && <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/15 text-warning text-xs font-bold shrink-0"><Trophy size={13} aria-hidden="true" />{w.prs.length} record{w.prs.length > 1 ? 's' : ''}</span>}
                      </div>
                      <p className="text-sm text-muted mt-2 truncate">{w.exercises.map((e) => EX_BY_ID[e.exId]?.name).join(' · ')}</p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm">
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-muted" aria-hidden="true" />{fmtDuration(w.duration)}</span>
                        <span className="flex items-center gap-1.5"><Flame size={14} className="text-primary" aria-hidden="true" /><span className="font-semibold tabular">{fmt(w.calories)}</span> kcal</span>
                        <span className="flex items-center gap-1.5"><Dumbbell size={14} className="text-info" aria-hidden="true" /><span className="font-semibold tabular">{fmtKg(w.volume)}</span></span>
                        <span className="text-muted">{w.sets} séries</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Card><EmptyState icon={HistoryIcon} title="Rien ce mois-ci" text="Tes séances terminées apparaîtront ici." action={<Link to="/seance" className="btn-primary btn-md">Démarrer une séance</Link>} /></Card>}
        </div>
      </div>
    </div>
  )
}
