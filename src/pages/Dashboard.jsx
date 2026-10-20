import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Play, Flame, Dumbbell, CalendarCheck, Zap, Trophy, ChevronRight, Activity, Scale, ArrowDownRight, ArrowUpRight, Clock, Target, Sparkles,
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'
import { useStore } from '../lib/store'
import { Card, CardHeader, StatTile, ProgressRing, Segmented, ChartTooltip, EmptyState } from '../components/ui'
import BodyMap from '../components/BodyMap'
import { InstallBanner, BackupReminder } from '../components/AppBanners'
import { PROGRAMS, TEMPLATE_BY_ID } from '../data/programs'
import { EX_BY_ID, MUSCLES } from '../data/exercises'
import {
  startOfWeek, addDays, dayKey, fmt, fmtKg, fmtDuration, fmtDate, relDay, weekStreak, muscleFatigue, xpInfo, startOfDay,
} from '../lib/calc'

const GOAL_PROGRAM = { lose: 'fatburn', muscle: 'ppl', strength: 'upper-lower', maintain: 'fullbody' }

export function suggestNext(workouts, lastProgram, goal) {
  const progId = lastProgram || GOAL_PROGRAM[goal] || 'fullbody'
  const prog = PROGRAMS.find((p) => p.id === progId) || PROGRAMS[0]
  const last = [...workouts].reverse().find((w) => w.programId === prog.id && TEMPLATE_BY_ID[w.templateId])
  const idx = last ? (prog.days.findIndex((d) => d.id === last.templateId) + 1) % prog.days.length : 0
  return { program: prog, template: { ...prog.days[idx], programId: prog.id } }
}

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function Dashboard() {
  const { profile, workouts, active, startWorkout, lastProgram, bodyLog } = useStore()
  const navigate = useNavigate()
  const [range, setRange] = useState('week')

  const now = new Date()
  const wkStart = startOfWeek(now)
  const wkIso = wkStart.toISOString(), prevIso = addDays(wkStart, -7).toISOString()
  const thisWeek = useMemo(() => workouts.filter((w) => w.startedAt >= wkIso), [workouts, wkIso])
  const lastWeek = useMemo(() => workouts.filter((w) => w.startedAt >= prevIso && w.startedAt < wkIso), [workouts, wkIso, prevIso])
  const recent90 = useMemo(() => { const since = addDays(now, -130).toISOString(); return workouts.filter((w) => w.startedAt >= since) }, [workouts])
  const sum = (arr, k) => arr.reduce((a, w) => a + (w[k] || 0), 0)
  const kcalWeek = sum(thisWeek, 'calories')
  const kcalLast = sum(lastWeek, 'calories')
  const volWeek = sum(thisWeek, 'volume')
  const target = profile.weeklyTarget || 3
  const streak = useMemo(() => weekStreak(workouts, target), [workouts, target])
  const xp = useMemo(() => xpInfo(workouts), [workouts])
  const next = suggestNext(workouts, lastProgram, profile.goal)
  const fatigue = useMemo(() => muscleFatigue(recent90), [recent90])

  const chart = useMemo(() => {
    if (range === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = addDays(wkStart, i)
        const k = dayKey(d)
        const ws = workouts.filter((w) => dayKey(w.startedAt) === k)
        return { label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''), date: d, kcal: sum(ws, 'calories'), today: k === dayKey(now) }
      })
    }
    return Array.from({ length: 12 }, (_, i) => {
      const s = addDays(wkStart, -7 * (11 - i)), e = addDays(s, 7)
      const ws = workouts.filter((w) => { const d = new Date(w.startedAt); return d >= s && d < e })
      return { label: fmtDate(s, { day: 'numeric', month: 'short' }), date: s, kcal: sum(ws, 'calories'), today: i === 11 }
    })
  }, [range, workouts])

  const recentPRs = workouts.slice(-20).flatMap((w) => (w.prs || []).map((p) => ({ ...p, date: w.startedAt, wid: w.id }))).slice(-5).reverse()
  const recent = workouts.slice(-4).reverse()
  const weightData = bodyLog.slice(-20)
  const wDelta = weightData.length > 1 ? weightData[weightData.length - 1].weight - weightData[0].weight : 0
  const freshMuscles = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'abs'].filter((m) => !fatigue[m] || fatigue[m] < 0.15)
  const tired = Object.entries(fatigue).filter(([, v]) => v >= 0.5).sort((a, b) => b[1] - a[1]).map(([m]) => MUSCLES[m])

  const start = (tpl) => { startWorkout(tpl); navigate('/seance') }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="eyebrow mb-1 capitalize">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-4xl sm:text-5xl font-bold uppercase leading-none">{greeting()}, <span className="text-primary">{profile.name}</span></h1>
          <p className="text-muted mt-2">
            {thisWeek.length >= target ? 'Objectif de la semaine atteint. Tu peux faire un bonus ou récupérer.' :
              `Encore ${target - thisWeek.length} séance${target - thisWeek.length > 1 ? 's' : ''} pour atteindre ton objectif de la semaine.`}
          </p>
        </div>
        <div className="flex items-center gap-3 card px-4 py-3">
          <Sparkles size={18} className="text-warning" aria-hidden="true" />
          <div>
            <div className="text-xs text-muted">Niveau {xp.level}</div>
            <div className="font-display text-xl font-bold leading-none">{xp.title}</div>
          </div>
          <div className="w-24 ml-2">
            <div className="h-2 rounded-full bg-raised overflow-hidden"><div className="h-full bg-warning rounded-full" style={{ width: `${xp.progress * 100}%` }} /></div>
            <div className="text-[11px] text-muted mt-1 tabular">{fmt(xp.toNext)} XP restants</div>
          </div>
        </div>
      </header>

      <InstallBanner />
      <BackupReminder />

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/25 via-surface to-surface p-6 sm:p-8 animate-fade-up">
          <div className="absolute -right-10 -bottom-16 font-display font-extrabold text-[180px] leading-none text-ink/[0.04] select-none uppercase" aria-hidden="true">
            {active ? 'GO' : next.template.name.split(' ')[0]}
          </div>
          <div className="relative">
            {active ? (
              <>
                <p className="eyebrow text-success flex items-center gap-2"><span className="size-2 rounded-full bg-success animate-pulse" />Séance en cours</p>
                <h2 className="text-4xl sm:text-5xl font-extrabold uppercase mt-2">{active.name}</h2>
                <p className="text-muted mt-2">{active.exercises.length} exercices · {active.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)} séries validées</p>
                <Link to="/seance" className="btn-primary btn-lg mt-6"><Play size={18} fill="currentColor" aria-hidden="true" /> Reprendre la séance</Link>
              </>
            ) : (
              <>
                <p className="eyebrow text-primary">Prochaine séance · {next.program.name}</p>
                <h2 className="text-4xl sm:text-5xl font-extrabold uppercase mt-2">{next.template.name}</h2>
                <p className="text-muted mt-1">{next.template.focus}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {next.template.exercises.slice(0, 4).map((e) => (
                    <span key={e.exId} className="px-3 py-1.5 rounded-lg bg-bg/50 border border-line text-sm">{EX_BY_ID[e.exId].name}</span>
                  ))}
                  {next.template.exercises.length > 4 && <span className="px-3 py-1.5 rounded-lg bg-bg/50 border border-line text-sm text-muted">+{next.template.exercises.length - 4}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  <button className="btn-primary btn-lg" onClick={() => start(next.template)}><Play size={18} fill="currentColor" aria-hidden="true" /> Démarrer</button>
                  <button className="btn-ghost btn-lg" onClick={() => start(null)}>Séance libre</button>
                </div>
              </>
            )}
          </div>
        </section>

        <Card className="p-6 flex flex-col sm:flex-row items-center gap-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <ProgressRing value={thisWeek.length / target} size={132} stroke={12} label={`${thisWeek.length} séances sur ${target} cette semaine`}>
            <div>
              <div className="font-display text-4xl font-bold leading-none tabular">{thisWeek.length}<span className="text-muted text-2xl">/{target}</span></div>
              <div className="text-xs text-muted mt-1">séances</div>
            </div>
          </ProgressRing>
          <div className="min-w-0">
            <p className="eyebrow">Cette semaine</p>
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(wkStart, i)
                const has = workouts.some((w) => dayKey(w.startedAt) === dayKey(d))
                const isToday = dayKey(d) === dayKey(now)
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className={`grid place-items-center size-8 rounded-lg text-xs font-bold ${has ? 'bg-primary text-bg' : isToday ? 'border-2 border-primary/60 text-ink' : 'bg-raised text-faint'}`}>
                      {has ? <Zap size={14} fill="currentColor" aria-hidden="true" /> : d.getDate()}
                    </span>
                    <span className="text-[10px] uppercase text-muted">{d.toLocaleDateString('fr-FR', { weekday: 'narrow' })}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-sm text-muted mt-3 flex items-center gap-1.5"><Flame size={15} className="text-primary" aria-hidden="true" /> Série de {streak} semaine{streak > 1 ? 's' : ''}</p>
          </div>
        </Card>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatTile icon={CalendarCheck} label="Séances (semaine)" value={thisWeek.length} unit={`/ ${target}`} sub={`${lastWeek.length} la semaine dernière`} tone="success" delay={0} />
        <StatTile icon={Flame} label="Calories brûlées" value={fmt(kcalWeek)} unit="kcal" delay={50}
          sub={<Delta value={kcalWeek - kcalLast} suffix=" kcal vs S-1" />} />
        <StatTile icon={Dumbbell} label="Volume soulevé" value={volWeek >= 1000 ? fmt(volWeek / 1000, 1) : fmt(volWeek)} unit={volWeek >= 1000 ? 't' : 'kg'} delay={100}
          sub={<Delta value={volWeek - sum(lastWeek, 'volume')} format={(v) => fmtKg(Math.abs(v))} suffix=" vs S-1" />} tone="info" />
        <StatTile icon={Trophy} label="Records (30 j)" value={recent90.filter((w) => w.startedAt > addDays(now, -30).toISOString()).reduce((a, w) => a + (w.prs?.length || 0), 0)} delay={150}
          sub={`${workouts.length} séances au total`} tone="warning" />
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-4">
        <Card className="p-5 sm:p-6">
          <CardHeader icon={Activity} title="Calories dépensées" subtitle={range === 'week' ? 'Par jour, semaine en cours' : 'Par semaine, 12 dernières semaines'}
            action={<Segmented size="sm" value={range} onChange={setRange} options={[{ value: 'week', label: '7 j' }, { value: 'quarter', label: '12 sem.' }]} />} />
          {workouts.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barCategoryGap="22%">
                  <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} interval={range === 'week' ? 0 : 'preserveStartEnd'} />
                  <YAxis tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgb(var(--raised) / 0.6)' }}
                    content={<ChartTooltip format={(v) => `${fmt(v)} kcal`} labelFormat={(l, p) => (range === 'week' ? fmtDate(p?.date, { weekday: 'long', day: 'numeric', month: 'short' }) : `Semaine du ${l}`)} />} />
                  <Bar dataKey="kcal" radius={[4, 4, 0, 0]} fill="rgb(var(--primary))" maxBarSize={44}
                    shape={(p) => <rect x={p.x} y={p.y} width={p.width} height={Math.max(p.height, 0)} rx={4} fill={p.payload.today ? 'rgb(var(--primary))' : 'rgb(var(--primary) / 0.55)'} />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState icon={Activity} title="Pas encore de données" text="Termine ta première séance pour voir ta dépense ici." />}
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader icon={Target} title="Récupération" subtitle="Sollicitation musculaire, 4 derniers jours" />
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr] xl:grid-cols-1 2xl:grid-cols-[1fr_1fr] gap-4 items-center">
            <BodyMap levels={fatigue} className="max-w-[300px] mx-auto w-full" />
            <div className="space-y-3 text-sm min-w-0">
              <div>
                <div className="flex items-center justify-between text-xs text-muted mb-1.5"><span>Récupéré</span><span>Sollicité</span></div>
                <div className="h-2 rounded-full bg-gradient-to-r from-raised via-primary/50 to-primary" aria-hidden="true" />
              </div>
              {tired.length > 0 && <p><span className="text-muted">À laisser récupérer : </span><span className="font-semibold">{tired.slice(0, 4).join(', ')}</span></p>}
              <p><span className="text-muted">Prêts à travailler : </span><span className="font-semibold text-success">{freshMuscles.length ? freshMuscles.slice(0, 5).map((m) => MUSCLES[m]).join(', ') : 'repos conseillé'}</span></p>
            </div>
          </div>
        </Card>
      </div>

      {/* Consistency + PRs + weight */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="p-5 sm:p-6 xl:col-span-2">
          <CardHeader icon={CalendarCheck} title="Régularité" subtitle="18 dernières semaines" />
          <Heatmap workouts={recent90} />
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader icon={Scale} title="Poids" subtitle={profile.targetWeight ? `Objectif : ${fmt(profile.targetWeight, 1)} kg` : undefined}
            action={<Link to="/calories" className="text-sm font-semibold text-primary hover:underline cursor-pointer">Détails</Link>} />
          <div className="flex items-baseline gap-3">
            <span className="font-display text-5xl font-bold tabular">{fmt(profile.weight, 1)}</span><span className="text-muted">kg</span>
            {weightData.length > 1 && (
              <span className={`flex items-center text-sm font-semibold ${wDelta <= 0 === (profile.goal !== 'muscle') ? 'text-success' : 'text-warning'}`}>
                {wDelta <= 0 ? <ArrowDownRight size={16} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}{fmt(Math.abs(wDelta), 1)} kg
              </span>
            )}
          </div>
          {weightData.length > 1 ? (
            <div className="h-28 mt-2 -mx-1">
              <ResponsiveContainer>
                <AreaChart data={weightData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(var(--success))" stopOpacity=".35" /><stop offset="1" stopColor="rgb(var(--success))" stopOpacity="0" /></linearGradient>
                  </defs>
                  <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <XAxis dataKey="date" hide />
                  <Tooltip content={<ChartTooltip format={(v) => `${fmt(v, 1)} kg`} labelFormat={(d) => fmtDate(d)} />} cursor={{ stroke: 'rgb(var(--faint))' }} />
                  <Area type="monotone" dataKey="weight" stroke="rgb(var(--success))" strokeWidth={2} fill="url(#wfill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted mt-3">Ajoute des pesées pour voir ta courbe.</p>}
          {profile.targetWeight && (
            <p className="text-sm text-muted mt-2">Il te reste <span className="text-ink font-semibold">{fmt(Math.abs(profile.weight - profile.targetWeight), 1)} kg</span> pour atteindre ton objectif.</p>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader icon={Trophy} title="Records récents" action={<Link to="/progression" className="text-sm font-semibold text-primary hover:underline cursor-pointer">Tout voir</Link>} />
          {recentPRs.length ? (
            <ul className="space-y-2">
              {recentPRs.map((p, i) => (
                <li key={i}>
                  <Link to={`/historique/${p.wid}`} className="flex items-center gap-3 p-3 rounded-xl bg-raised/60 hover:bg-raised transition cursor-pointer">
                    <span className="grid place-items-center size-9 rounded-lg bg-warning/15 text-warning"><Trophy size={16} aria-hidden="true" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{EX_BY_ID[p.exId]?.name}</span>
                      <span className="block text-xs text-muted">{relDay(p.date)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-lg font-bold tabular">{prValue(p)}</span>
                      <span className="block text-[11px] text-success tabular">+{fmt(p.value - p.prev, 1)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Tes records personnels apparaîtront ici dès que tu les battras.</p>}
        </Card>

        <Card className="p-5 sm:p-6 lg:col-span-2 xl:col-span-2">
          <CardHeader icon={Clock} title="Dernières séances" action={<Link to="/historique" className="text-sm font-semibold text-primary hover:underline cursor-pointer">Historique</Link>} />
          {recent.length ? (
            <ul className="grid sm:grid-cols-2 gap-3">
              {recent.map((w) => (
                <li key={w.id}>
                  <Link to={`/historique/${w.id}`} className="group block p-4 rounded-xl border border-line bg-raised/40 hover:border-primary/50 transition cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display text-xl font-bold uppercase truncate">{w.name}</div>
                        <div className="text-sm text-muted">{relDay(w.startedAt)} · {fmtDuration(w.duration)}</div>
                      </div>
                      <ChevronRight size={18} className="text-faint group-hover:text-primary transition shrink-0" aria-hidden="true" />
                    </div>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1.5"><Flame size={14} className="text-primary" aria-hidden="true" /><span className="tabular font-semibold">{fmt(w.calories)}</span> kcal</span>
                      <span className="flex items-center gap-1.5"><Dumbbell size={14} className="text-info" aria-hidden="true" /><span className="tabular font-semibold">{fmtKg(w.volume)}</span></span>
                      {w.prs?.length > 0 && <span className="flex items-center gap-1.5 text-warning"><Trophy size={14} aria-hidden="true" />{w.prs.length}</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={Dumbbell} title="Aucune séance" text="Lance ta première séance pour commencer à suivre tes progrès." action={<button className="btn-primary btn-md" onClick={() => start(next.template)}>Démarrer</button>} />}
        </Card>
      </div>
    </div>
  )
}

export function prValue(p) {
  if (p.kind === 'reps') return `${p.value} reps`
  if (p.kind === 'sec') return `${p.value} s`
  return `${fmt(p.value, 1)} kg`
}

function Delta({ value, suffix = '', format = (v) => fmt(Math.abs(v)) }) {
  if (!value) return <span>Stable vs S-1</span>
  const up = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 ${up ? 'text-success' : 'text-muted'}`}>
      {up ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
      {format(value)}{suffix}
    </span>
  )
}

function Heatmap({ workouts }) {
  const weeks = 18
  const start = addDays(startOfWeek(new Date()), -7 * (weeks - 1))
  const byDay = {}
  for (const w of workouts) {
    const k = dayKey(w.startedAt)
    byDay[k] = (byDay[k] || 0) + (w.calories || 0)
  }
  const max = Math.max(1, ...Object.values(byDay))
  const today = startOfDay(new Date())
  const level = (v) => (!v ? 0 : v < max * 0.33 ? 1 : v < max * 0.66 ? 2 : 3)
  const colors = ['rgb(var(--raised))', 'rgb(var(--primary) / 0.35)', 'rgb(var(--primary) / 0.65)', 'rgb(var(--primary))']
  const activeDays = Object.keys(byDay).filter((k) => new Date(k) >= start).length
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-flow-col gap-1 w-max" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
          {Array.from({ length: weeks * 7 }, (_, i) => {
            const d = addDays(start, i)
            const k = dayKey(d)
            const v = byDay[k] || 0
            const future = d > today
            return (
              <span key={k} title={future ? '' : `${fmtDate(d)} — ${v ? fmt(v) + ' kcal' : 'repos'}`}
                className={`size-[15px] sm:size-[18px] rounded-[4px] ${future ? 'opacity-0' : ''} ${k === dayKey(today) ? 'ring-1 ring-ink/60' : ''}`}
                style={{ background: colors[level(v)] }} />
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm">
        <span className="text-muted"><span className="text-ink font-semibold tabular">{activeDays}</span> jours actifs sur {weeks} semaines</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">Moins {colors.map((c, i) => <span key={i} className="size-3 rounded-[3px]" style={{ background: c }} />)} Plus</span>
      </div>
    </div>
  )
}
