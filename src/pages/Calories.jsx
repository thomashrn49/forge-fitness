import { useMemo, useState } from 'react'
import { Flame, Scale, Target, Utensils, Plus, Trash2, AlertTriangle, Activity, HeartPulse, CalendarClock, Info } from 'lucide-react'
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { useStore } from '../lib/store'
import { PageHeader, Card, CardHeader, StatTile, ChartTooltip, Field } from '../components/ui'
import { bmr, tdee, bmi, bmiLabel, fmt, fmtDate, dayKey, addDays, KCAL_PER_KG_FAT, ACTIVITY } from '../lib/calc'

const axis = { fill: 'rgb(var(--muted))', fontSize: 12 }

export default function Calories() {
  const { profile, setProfile, workouts, bodyLog, addBodyEntry, deleteBodyEntry } = useStore()
  const [entry, setEntry] = useState({ date: dayKey(new Date()), weight: profile.weight, bodyFat: '', waist: '' })
  const [err, setErr] = useState('')

  const base = bmr(profile)
  const neat = tdee(profile)
  const since = addDays(new Date(), -28)
  const recent = workouts.filter((w) => new Date(w.startedAt) >= since)
  const exerciseDaily = Math.round(recent.reduce((a, w) => a + (w.calories || 0), 0) / 28)
  const total = neat + exerciseDaily
  const intake = profile.intake || Math.round(total - 400)
  const balance = intake - total // negative = deficit
  const kgPerWeek = (balance * 7) / KCAL_PER_KG_FAT
  const toGo = (profile.targetWeight || profile.weight) - profile.weight
  const sameDirection = toGo !== 0 && Math.sign(toGo) === Math.sign(kgPerWeek)
  const weeksToGoal = sameDirection ? Math.abs(toGo / kgPerWeek) : null
  const goalDate = weeksToGoal ? addDays(new Date(), Math.round(weeksToGoal * 7)) : null
  const allKcal = workouts.reduce((a, w) => a + (w.calories || 0), 0)
  const b = bmi(profile)

  const protein = Math.round(profile.weight * (profile.goal === 'lose' ? 2 : 1.8))
  const fat = Math.round(profile.weight * 0.9)
  const carbs = Math.max(0, Math.round((intake - protein * 4 - fat * 9) / 4))

  const chart = useMemo(() => {
    const pts = bodyLog.slice(-30).map((e) => ({ t: new Date(e.date + 'T12:00').getTime(), actual: e.weight }))
    const now = Date.now()
    const horizon = Math.min(26, Math.max(8, Math.ceil(weeksToGoal || 12)))
    for (let w = 0; w <= horizon; w++) {
      let proj = profile.weight + kgPerWeek * w
      if (profile.targetWeight && sameDirection) proj = toGo < 0 ? Math.max(proj, profile.targetWeight) : Math.min(proj, profile.targetWeight)
      pts.push({ t: now + w * 7 * 86400000, projection: Math.round(proj * 10) / 10 })
    }
    return pts.sort((a, b) => a.t - b.t)
  }, [bodyLog, profile, kgPerWeek, weeksToGoal, sameDirection, toGo])

  const submit = (e) => {
    e.preventDefault()
    if (!(+entry.weight >= 30 && +entry.weight <= 300)) return setErr('Indique un poids entre 30 et 300 kg.')
    setErr('')
    addBodyEntry(entry)
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Énergie & composition" title="Calories & poids" subtitle="Ta dépense estimée, ton bilan calorique et la projection vers ton objectif de poids." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatTile icon={HeartPulse} label="Métabolisme de base" value={fmt(base)} unit="kcal/j" sub="Formule Mifflin-St Jeor" tone="info" />
        <StatTile icon={Activity} label="Dépense quotidienne" value={fmt(neat)} unit="kcal/j" sub={ACTIVITY.find((a) => a.v === profile.activity)?.label} tone="success" />
        <StatTile icon={Flame} label="Sport (moyenne)" value={`+${fmt(exerciseDaily)}`} unit="kcal/j" sub="Calculé sur 28 jours de séances" />
        <StatTile icon={Target} label="Dépense totale" value={fmt(total)} unit="kcal/j" sub={`${fmt(allKcal)} kcal brûlées depuis le début ≈ ${fmt(allKcal / KCAL_PER_KG_FAT, 1)} kg de graisse`} tone="warning" />
      </div>

      <div className="grid xl:grid-cols-[1fr_1.4fr] gap-4">
        <Card className="p-5 sm:p-6">
          <CardHeader icon={Utensils} title="Bilan calorique" subtitle="Ajuste ton apport journalier moyen" />
          <div className="flex items-baseline justify-between">
            <label htmlFor="intake" className="text-muted">Apport quotidien</label>
            <span className="font-display text-4xl font-bold tabular">{fmt(intake)} <span className="text-lg text-muted">kcal</span></span>
          </div>
          <input id="intake" type="range" min={1200} max={4500} step={50} value={intake} onChange={(e) => setProfile({ intake: +e.target.value })}
            className="w-full mt-3 accent-[rgb(var(--primary))]" />
          <div className="flex justify-between text-xs text-faint tabular"><span>1 200</span><span>4 500</span></div>

          <div className={`mt-5 p-4 rounded-xl border ${balance < 0 ? 'bg-success/10 border-success/30' : balance > 0 ? 'bg-info/10 border-info/30' : 'bg-raised border-line'}`}>
            <div className="text-sm text-muted">{balance < 0 ? 'Déficit' : balance > 0 ? 'Surplus' : 'Équilibre'} quotidien</div>
            <div className="font-display text-4xl font-bold tabular">{balance > 0 ? '+' : balance < 0 ? '−' : ''}{fmt(Math.abs(balance))} kcal</div>
            <div className="text-sm mt-1">≈ <span className="font-semibold">{kgPerWeek > 0 ? '+' : kgPerWeek < 0 ? '−' : ''}{fmt(Math.abs(kgPerWeek), 2)} kg</span> par semaine · {fmt(Math.abs(kgPerWeek) * 4.3, 1)} kg par mois</div>
          </div>

          {(intake < base || balance < -1000) && (
            <p className="mt-3 flex gap-2 text-sm text-warning"><AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              Déficit très agressif : tu risques de perdre du muscle et de l’énergie. Vise plutôt 300 à 600 kcal de déficit par jour.</p>
          )}

          <div className="mt-5 p-4 rounded-xl bg-raised/60">
            <div className="flex items-center gap-2 text-sm text-muted"><CalendarClock size={15} aria-hidden="true" />Objectif {fmt(profile.targetWeight, 1)} kg</div>
            {toGo === 0 ? <p className="font-semibold mt-1">Objectif atteint, bravo !</p> :
              goalDate ? <p className="mt-1"><span className="font-display text-2xl font-bold">{fmtDate(goalDate, { day: 'numeric', month: 'long', year: 'numeric' })}</span><span className="text-muted text-sm block">dans environ {fmt(weeksToGoal)} semaines, à ce rythme</span></p> :
                <p className="mt-1 text-sm">Avec cet apport, tu t’éloignes de ton objectif ({toGo < 0 ? 'il faut un déficit' : 'il faut un surplus'}).</p>}
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold mb-2">Répartition conseillée</div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5" aria-hidden="true">
              <span className="bg-primary" style={{ flex: protein * 4 }} /><span className="bg-warning" style={{ flex: fat * 9 }} /><span className="bg-info" style={{ flex: carbs * 4 }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {[['Protéines', protein, 'bg-primary'], ['Lipides', fat, 'bg-warning'], ['Glucides', carbs, 'bg-info']].map(([l, g, c]) => (
                <div key={l} className="rounded-xl bg-raised/60 p-2.5">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted"><span className={`size-2 rounded-full ${c}`} />{l}</div>
                  <div className="font-display text-2xl font-bold tabular">{g} g</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader icon={Scale} title="Courbe de poids & projection" subtitle="Pesées réelles et projection selon ton bilan calorique" />
          <div className="flex flex-wrap gap-4 text-sm mb-2" aria-hidden="true">
            <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-success rounded" />Pesées</span>
            <span className="flex items-center gap-2"><span className="w-4 border-t-2 border-dashed border-primary" />Projection</span>
            {profile.targetWeight && <span className="flex items-center gap-2"><span className="w-4 border-t border-dashed border-muted" />Objectif</span>}
          </div>
          <div className="h-80">
            <ResponsiveContainer>
              <ComposedChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(t) => fmtDate(t, { day: 'numeric', month: 'short' })} tick={axis} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis tick={axis} axisLine={false} tickLine={false} domain={[(min) => Math.floor(Math.min(min, profile.targetWeight || min) - 1), (max) => Math.ceil(max + 1)]} />
                <Tooltip content={<ChartTooltip format={(v, p) => `${p.dataKey === 'actual' ? 'Pesée' : 'Projection'} : ${fmt(v, 1)} kg`} labelFormat={(t) => fmtDate(t)} />} cursor={{ stroke: 'rgb(var(--faint))' }} />
                {profile.targetWeight && <ReferenceLine y={profile.targetWeight} stroke="rgb(var(--muted))" strokeDasharray="4 4" label={{ value: 'Objectif', position: 'insideTopRight', fill: 'rgb(var(--muted))', fontSize: 12 }} />}
                <ReferenceLine x={Date.now()} stroke="rgb(var(--line))" />
                <Line dataKey="actual" stroke="rgb(var(--success))" strokeWidth={2} dot={{ r: 3, fill: 'rgb(var(--success))', stroke: 'rgb(var(--surface))', strokeWidth: 2 }} connectNulls isAnimationActive={false} />
                <Line dataKey="projection" stroke="rgb(var(--primary))" strokeWidth={2} strokeDasharray="6 5" dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted mt-3 flex gap-1.5"><Info size={13} className="shrink-0 mt-0.5" aria-hidden="true" />Estimation basée sur 7 700 kcal ≈ 1 kg de masse grasse. Le poids réel fluctue (eau, glycogène) : regarde la tendance sur plusieurs semaines.</p>
        </Card>
      </div>

      <div className="grid xl:grid-cols-[1fr_1.4fr] gap-4 items-start">
        <Card className="p-5 sm:p-6">
          <CardHeader icon={Plus} title="Nouvelle pesée" />
          <form onSubmit={submit} className="grid grid-cols-2 gap-3" noValidate>
            <Field label="Date" id="bd-date"><input id="bd-date" type="date" className="input" value={entry.date} max={dayKey(new Date())} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></Field>
            <Field label="Poids (kg)" id="bd-w"><input id="bd-w" type="number" step="0.1" inputMode="decimal" className="input" value={entry.weight} onChange={(e) => setEntry({ ...entry, weight: e.target.value })} aria-invalid={!!err} /></Field>
            <Field label="Masse grasse (%)" id="bd-bf" hint="Facultatif"><input id="bd-bf" type="number" step="0.1" inputMode="decimal" className="input" value={entry.bodyFat} onChange={(e) => setEntry({ ...entry, bodyFat: e.target.value })} /></Field>
            <Field label="Tour de taille (cm)" id="bd-wa" hint="Facultatif"><input id="bd-wa" type="number" step="0.5" inputMode="decimal" className="input" value={entry.waist} onChange={(e) => setEntry({ ...entry, waist: e.target.value })} /></Field>
            {err && <p className="col-span-2 text-sm text-danger" role="alert">{err}</p>}
            <button className="btn-primary btn-md col-span-2">Enregistrer la pesée</button>
          </form>
          <div className="mt-5 p-4 rounded-xl bg-raised/60 flex items-center justify-between">
            <div><div className="text-sm text-muted">IMC</div><div className="font-display text-3xl font-bold tabular">{fmt(b, 1)}</div></div>
            <div className="text-right text-sm"><div className="font-semibold">{bmiLabel(b)}</div><div className="text-muted text-xs max-w-[180px]">Indicatif : l’IMC ne distingue pas le muscle de la graisse.</div></div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader icon={Scale} title="Journal des pesées" subtitle={`${bodyLog.length} entrées`} />
          <div className="overflow-x-auto -mx-5 sm:-mx-6 max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm min-w-[440px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-left text-[11px] uppercase tracking-wider text-faint border-b border-line">
                  <th className="font-semibold py-2 px-5 sm:px-6">Date</th><th className="font-semibold py-2 px-3 text-right">Poids</th>
                  <th className="font-semibold py-2 px-3 text-right">Écart</th><th className="font-semibold py-2 px-3 text-right">MG</th><th className="py-2 px-5 sm:px-6" />
                </tr>
              </thead>
              <tbody>
                {bodyLog.slice().reverse().map((e, i, arr) => {
                  const prev = arr[i + 1]
                  const d = prev ? e.weight - prev.weight : 0
                  return (
                    <tr key={e.id} className="border-b border-line/50">
                      <td className="py-2.5 px-5 sm:px-6">{fmtDate(e.date + 'T12:00', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })}</td>
                      <td className="py-2.5 px-3 text-right tabular font-semibold">{fmt(e.weight, 1)} kg</td>
                      <td className={`py-2.5 px-3 text-right tabular ${d < 0 ? 'text-success' : d > 0 ? 'text-warning' : 'text-muted'}`}>{prev ? `${d > 0 ? '+' : ''}${fmt(d, 1)}` : '—'}</td>
                      <td className="py-2.5 px-3 text-right tabular text-muted">{e.bodyFat ? `${e.bodyFat} %` : '—'}</td>
                      <td className="py-2.5 px-5 sm:px-6 text-right">
                        <button className="btn-ghost size-8 rounded-lg hover:text-danger" onClick={() => deleteBodyEntry(e.id)} aria-label={`Supprimer la pesée du ${e.date}`}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
