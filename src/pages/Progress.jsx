import { useMemo, useState } from 'react'
import { TrendingUp, Trophy, Dumbbell, BarChart3, Target, ArrowUpRight, Table2 } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, ReferenceArea } from 'recharts'
import { useStore } from '../lib/store'
import { PageHeader, Card, CardHeader, Segmented, ChartTooltip, EmptyState, StatTile } from '../components/ui'
import { exerciseHistory, metricLabel } from '../components/ExerciseDetail'
import { EX_BY_ID, MUSCLES } from '../data/exercises'
import { computeRecords, fmt, fmtKg, fmtDate, startOfWeek, addDays, isDone } from '../lib/calc'

const axis = { fill: 'rgb(var(--muted))', fontSize: 12 }

export default function Progress() {
  const workouts = useStore((s) => s.workouts)
  const [tab, setTab] = useState('force')

  if (!workouts.length) {
    return (
      <div>
        <PageHeader eyebrow="Analyse" title="Progression" />
        <Card><EmptyState icon={TrendingUp} title="Pas encore de données" text="Termine quelques séances : tes courbes de force, de volume et tes records apparaîtront ici." /></Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader eyebrow="Analyse" title="Progression" subtitle="Suis ta force, ton volume d’entraînement et tes records au fil des semaines."
        actions={<Segmented value={tab} onChange={setTab} options={[{ value: 'force', label: 'Force' }, { value: 'volume', label: 'Volume' }, { value: 'records', label: 'Records' }]} />} />
      {tab === 'force' && <Strength workouts={workouts} />}
      {tab === 'volume' && <Volume workouts={workouts} />}
      {tab === 'records' && <Records workouts={workouts} />}
    </div>
  )
}

function Strength({ workouts }) {
  const used = useMemo(() => {
    const u = {}
    for (const w of workouts) for (const e of w.exercises) if (EX_BY_ID[e.exId]) u[e.exId] = (u[e.exId] || 0) + 1
    return Object.entries(u).sort((a, b) => b[1] - a[1]).map(([id]) => id)
  }, [workouts])
  const [exId, setExId] = useState(used.find((id) => EX_BY_ID[id].type === 'weight') || used[0])
  const ex = EX_BY_ID[exId]
  const [range, setRange] = useState('180')
  const all = useMemo(() => exerciseHistory(workouts, exId), [workouts, exId])
  const data = useMemo(() => {
    const since = range === 'all' ? '' : new Date(Date.now() - +range * 86400000).toISOString()
    const pts = all.filter((p) => p.date >= since)
    if (pts.length <= 120) return pts
    // too many points: keep the best performance of each week
    const byWeek = new Map()
    for (const p of pts) {
      const d = new Date(p.date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const k = d.getTime()
      if (!byWeek.has(k) || p.value > byWeek.get(k).value) byWeek.set(k, p)
    }
    return [...byWeek.values()]
  }, [all, range])
  const metric = metricLabel(ex)
  const first = data[0]?.value || 0, last = data[data.length - 1]?.value || 0
  const best = all.reduce((m, d) => Math.max(m, d.value), 0)
  const gain = first ? ((last - first) / first) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {used.slice(0, 12).map((id) => (
          <button key={id} className={exId === id ? 'chip-on' : 'chip-off'} onClick={() => setExId(id)} aria-pressed={exId === id}>{EX_BY_ID[id].name}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={TrendingUp} label={`${metric.name} actuel`} value={fmt(last, 1)} unit={metric.unit} />
        <StatTile icon={Trophy} label="Meilleure perf." value={fmt(best, 1)} unit={metric.unit} tone="warning" />
        <StatTile icon={ArrowUpRight} label="Progression" value={`${gain >= 0 ? '+' : ''}${fmt(gain, 1)}`} unit="%" sub={range === 'all' ? 'depuis la 1re séance' : 'sur la période'} tone={gain >= 0 ? 'success' : 'danger'} />
        <StatTile icon={Dumbbell} label="Séances" value={all.length} sub={ex.name} tone="info" />
      </div>
      <Card className="p-5 sm:p-6">
        <CardHeader icon={TrendingUp} title={`${metric.name} · ${ex.name}`} subtitle={ex.type === 'weight' ? 'Formule d’Epley : charge × (1 + reps / 30), meilleure série de chaque séance' : undefined}
          action={<Segmented size="sm" value={range} onChange={setRange} options={[{ value: '90', label: '3 m' }, { value: '180', label: '6 m' }, { value: '365', label: '1 an' }, { value: 'all', label: 'Tout' }]} />} />
        {data.length >= 2 ? (
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => fmtDate(d, { day: 'numeric', month: 'short' })} tick={axis} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis tick={axis} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<ChartTooltip format={(v, p) => `${fmt(v, 1)} ${metric.unit}${p.payload.top?.kg ? ` (${p.payload.top.kg} × ${p.payload.top.reps})` : ''}`} labelFormat={(d) => fmtDate(d)} />} cursor={{ stroke: 'rgb(var(--faint))' }} />
                <Line type="monotone" dataKey="value" stroke="rgb(var(--primary))" strokeWidth={2} dot={data.length <= 40 ? { r: 4, fill: 'rgb(var(--primary))', stroke: 'rgb(var(--surface))', strokeWidth: 2 } : false} activeDot={{ r: 7 }} isAnimationActive={data.length <= 60} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-muted">{all.length >= 2 ? 'Pas assez de séances sur cette période : choisis une période plus longue.' : 'Il faut au moins deux séances avec cet exercice pour tracer la courbe.'}</p>}
      </Card>
    </div>
  )
}

function Volume({ workouts }) {
  const weeks = useMemo(() => {
    const ws = startOfWeek(new Date())
    return Array.from({ length: 12 }, (_, i) => {
      const s = addDays(ws, -7 * (11 - i)), e = addDays(s, 7)
      const list = workouts.filter((w) => { const d = new Date(w.startedAt); return d >= s && d < e })
      return { label: fmtDate(s, { day: 'numeric', month: 'short' }), volume: list.reduce((a, w) => a + (w.volume || 0), 0), sessions: list.length, current: i === 11 }
    })
  }, [workouts])

  // average weekly working sets per muscle, last 4 weeks
  const perMuscle = useMemo(() => {
    const since = addDays(new Date(), -28)
    const m = {}
    for (const w of workouts) {
      if (new Date(w.startedAt) < since) continue
      for (const we of w.exercises) {
        const ex = EX_BY_ID[we.exId]
        if (!ex || ex.type === 'cardio') continue
        const n = we.sets.filter(isDone).length
        for (const p of ex.primary) m[p] = (m[p] || 0) + n
        for (const p of ex.secondary) m[p] = (m[p] || 0) + n * 0.5
      }
    }
    return Object.keys(MUSCLES).map((k) => ({ muscle: MUSCLES[k], sets: Math.round(((m[k] || 0) / 4) * 10) / 10 })).sort((a, b) => b.sets - a.sets)
  }, [workouts])
  const under = perMuscle.filter((m) => m.sets < 10 && m.sets > 0).map((m) => m.muscle)
  const zero = perMuscle.filter((m) => !m.sets).map((m) => m.muscle)

  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <Card className="p-5 sm:p-6">
        <CardHeader icon={BarChart3} title="Volume hebdomadaire" subtitle="Charge totale soulevée (kg × reps), 12 semaines" />
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={weeks} margin={{ top: 8, right: 4, left: -4, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${fmt(v / 1000)} t` : v)} />
              <Tooltip cursor={{ fill: 'rgb(var(--raised) / 0.6)' }} content={<ChartTooltip format={(v, p) => `${fmtKg(v)} · ${p.payload.sessions} séance${p.payload.sessions > 1 ? 's' : ''}`} labelFormat={(l) => `Semaine du ${l}`} />} />
              <Bar dataKey="volume" maxBarSize={40}
                shape={(p) => <rect x={p.x} y={p.y} width={p.width} height={Math.max(0, p.height)} rx={4} fill={p.payload.current ? 'rgb(var(--info))' : 'rgb(var(--info) / 0.5)'} />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <CardHeader icon={Target} title="Séries par muscle" subtitle="Moyenne hebdomadaire (4 dernières semaines). Zone verte : 10 à 20 séries, le repère courant pour l’hypertrophie" />
        <div className="h-[420px]">
          <ResponsiveContainer>
            <BarChart data={perMuscle} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }} barCategoryGap="22%">
              <ReferenceArea x1={10} x2={20} fill="rgb(var(--success))" fillOpacity={0.08} stroke="rgb(var(--success))" strokeOpacity={0.3} strokeDasharray="3 3" />
              <XAxis type="number" tick={axis} axisLine={false} tickLine={false} domain={[0, (max) => Math.max(22, Math.ceil(max))]} />
              <YAxis type="category" dataKey="muscle" tick={axis} axisLine={false} tickLine={false} width={110} />
              <Tooltip cursor={{ fill: 'rgb(var(--raised) / 0.6)' }} content={<ChartTooltip format={(v) => `${fmt(v, 1)} séries / sem.`} />} />
              <Bar dataKey="sets" maxBarSize={16}
                shape={(p) => <rect x={p.x} y={p.y} width={Math.max(0, p.width)} height={p.height} rx={4} fill="rgb(var(--primary))" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {(under.length > 0 || zero.length > 0) && (
          <p className="text-sm text-muted mt-3">
            {under.length > 0 && <>Peu travaillés : <span className="text-warning font-medium">{under.slice(0, 4).join(', ')}</span>. </>}
            {zero.length > 0 && <>Jamais travaillés ce mois-ci : <span className="text-ink font-medium">{zero.slice(0, 4).join(', ')}</span>.</>}
          </p>
        )}
      </Card>
    </div>
  )
}

function Records({ workouts }) {
  const recs = useMemo(() => {
    const r = computeRecords(workouts)
    return Object.entries(r).map(([id, v]) => ({ id, ex: EX_BY_ID[id], ...v })).filter((x) => x.ex && x.ex.type !== 'cardio')
      .sort((a, b) => (b.e1rm || 0) - (a.e1rm || 0))
  }, [workouts])
  const allPRs = workouts.flatMap((w) => (w.prs || []).map((p) => ({ ...p, date: w.startedAt }))).reverse()

  return (
    <div className="grid xl:grid-cols-[1.4fr_1fr] gap-4 items-start">
      <Card className="p-5 sm:p-6 overflow-hidden">
        <CardHeader icon={Table2} title="Meilleures performances" subtitle="Par exercice, toutes séances confondues" />
        <div className="overflow-x-auto -mx-5 sm:-mx-6">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-faint border-b border-line">
                <th className="font-semibold py-2 px-5 sm:px-6">Exercice</th>
                <th className="font-semibold py-2 px-3 text-right">Meilleure série</th>
                <th className="font-semibold py-2 px-3 text-right">1RM est.</th>
                <th className="font-semibold py-2 px-5 sm:px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r) => (
                <tr key={r.id} className="border-b border-line/50 hover:bg-raised/40">
                  <td className="py-3 px-5 sm:px-6 font-medium">{r.ex.name}</td>
                  <td className="py-3 px-3 text-right tabular">{r.bestSet ? `${r.bestSet.kg} kg × ${r.bestSet.reps}` : r.sec ? `${r.sec} s` : `${r.reps} reps`}</td>
                  <td className="py-3 px-3 text-right tabular font-semibold text-primary">{r.e1rm ? `${fmt(r.e1rm, 1)} kg` : '—'}</td>
                  <td className="py-3 px-5 sm:px-6 text-right text-muted tabular">{r.date ? fmtDate(r.date, { day: 'numeric', month: 'short' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardHeader icon={Trophy} title="Journal des records" subtitle={`${allPRs.length} records battus`} />
        <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
          {allPRs.slice(0, 40).map((p, i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-raised/50">
              <Trophy size={16} className="text-warning shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{EX_BY_ID[p.exId]?.name}</div>
                <div className="text-xs text-muted">{fmtDate(p.date)}</div>
              </div>
              <div className="text-right tabular">
                <div className="font-semibold">{p.kind === 'reps' ? `${p.value} reps` : p.kind === 'sec' ? `${p.value} s` : `${fmt(p.value, 1)} kg`}</div>
                <div className="text-xs text-success">+{fmt(p.value - p.prev, 1)}</div>
              </div>
            </li>
          ))}
          {!allPRs.length && <li className="text-muted text-sm">Aucun record pour l’instant. Ça va venir !</li>}
        </ul>
      </Card>
    </div>
  )
}
