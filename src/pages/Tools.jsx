import { useEffect, useRef, useState } from 'react'
import { Calculator, Disc3, TimerReset, Play, Pause, RotateCcw } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, Card, CardHeader, Field, Segmented, ProgressRing } from '../components/ui'
import { e1rm, fmt, fmtClock } from '../lib/calc'

export default function Tools() {
  return (
    <div>
      <PageHeader eyebrow="Boîte à outils" title="Outils" subtitle="Les calculs utiles à la salle : charge maximale, chargement de la barre et minuteur d’intervalles." />
      <div className="grid xl:grid-cols-2 gap-4 items-start">
        <OneRepMax />
        <PlateCalc />
        <IntervalTimer />
      </div>
    </div>
  )
}

const PCT = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50]
const REPS_AT = { 100: 1, 95: 2, 90: 4, 85: 6, 80: 8, 75: 10, 70: 12, 65: 15, 60: 18, 50: 25 }

function OneRepMax() {
  const [kg, setKg] = useState(80)
  const [reps, setReps] = useState(6)
  const max = e1rm(+kg, +reps)
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader icon={Calculator} title="Calculateur 1RM" subtitle="Estime ta charge maximale sur une répétition" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Charge (kg)" id="rm-kg"><input id="rm-kg" type="number" inputMode="decimal" className="input" value={kg} onChange={(e) => setKg(e.target.value)} /></Field>
        <Field label="Répétitions" id="rm-reps"><input id="rm-reps" type="number" inputMode="numeric" min="1" max="15" className="input" value={reps} onChange={(e) => setReps(e.target.value)} /></Field>
      </div>
      <div className="mt-5 p-5 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 text-center">
        <div className="eyebrow">1RM estimé</div>
        <div className="font-display text-6xl font-extrabold tabular text-primary leading-none mt-1">{fmt(max, 1)}<span className="text-2xl text-muted ml-1">kg</span></div>
      </div>
      <table className="w-full text-sm mt-5">
        <thead><tr className="text-[11px] uppercase tracking-wider text-faint border-b border-line"><th className="text-left py-2 font-semibold">% du 1RM</th><th className="text-right py-2 font-semibold">Charge</th><th className="text-right py-2 font-semibold">Reps env.</th></tr></thead>
        <tbody>
          {PCT.map((p) => (
            <tr key={p} className="border-b border-line/50">
              <td className="py-2">
                <div className="flex items-center gap-3"><span className="w-10 tabular">{p} %</span><span className="flex-1 h-1.5 rounded-full bg-raised max-w-[140px]"><span className="block h-full rounded-full bg-primary" style={{ width: `${p}%` }} /></span></div>
              </td>
              <td className="py-2 text-right tabular font-semibold">{fmt(Math.round((max * p) / 100 / 1.25) * 1.25, 1)} kg</td>
              <td className="py-2 text-right tabular text-muted">{REPS_AT[p]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

const PLATE_STYLE = {
  25: { c: '#DC2626', h: 96 }, 20: { c: '#2563EB', h: 96 }, 15: { c: '#EAB308', h: 86 }, 10: { c: '#16A34A', h: 76 },
  5: { c: '#F5F7FA', h: 60 }, 2.5: { c: '#475569', h: 50 }, 1.25: { c: '#94A3B8', h: 42 },
}

function PlateCalc() {
  const { settings, updateSettings } = useStore()
  const [target, setTarget] = useState(100)
  const bar = settings.bar
  let rest = Math.max(0, (+target - bar) / 2)
  const plates = []
  for (const p of settings.plates) while (rest >= p - 1e-9) { plates.push(p); rest -= p }
  const loaded = bar + plates.reduce((a, b) => a + b, 0) * 2

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader icon={Disc3} title="Chargement de barre" subtitle="Quels disques mettre de chaque côté ?" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Charge visée (kg)" id="pl-t"><input id="pl-t" type="number" inputMode="decimal" step="2.5" className="input" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
        <div>
          <span className="label">Barre</span>
          <Segmented value={bar} onChange={(v) => updateSettings({ bar: v })} options={[{ value: 20, label: '20 kg' }, { value: 15, label: '15 kg' }, { value: 10, label: '10 kg' }]} size="sm" className="w-full [&>button]:flex-1" />
        </div>
      </div>
      <div className="mt-6 rounded-xl bg-raised/50 border border-line p-4 overflow-x-auto">
        <div className="flex items-center justify-center min-w-[300px] h-28" role="img" aria-label={`Par côté : ${plates.join(', ') || 'aucun disque'} kg`}>
          <div className="h-3 w-10 rounded-l bg-faint" />
          <div className="h-8 w-3 rounded-sm bg-muted" />
          {plates.map((p, i) => (
            <div key={i} className="mx-[1px] rounded-[3px] grid place-items-center animate-scale-in" style={{ background: PLATE_STYLE[p].c, height: PLATE_STYLE[p].h, width: p >= 10 ? 16 : 11, animationDelay: `${i * 40}ms` }}>
              <span className="text-[9px] font-bold [writing-mode:vertical-rl] rotate-180" style={{ color: p === 5 ? '#0A0D12' : '#fff' }}>{p}</span>
            </div>
          ))}
          <div className="h-3 flex-1 max-w-[120px] rounded-r bg-faint" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted">Par côté : <span className="text-ink font-semibold">{plates.length ? plates.join(' + ') + ' kg' : 'barre seule'}</span></div>
        <div className="font-display text-2xl font-bold tabular">{fmt(loaded, 2)} kg</div>
      </div>
      {Math.abs(loaded - +target) > 0.01 && +target > bar && <p className="text-sm text-warning mt-2">Charge exacte impossible avec tes disques. Le plus proche est {fmt(loaded, 2)} kg.</p>}
      {+target < bar && <p className="text-sm text-warning mt-2">La charge visée est inférieure au poids de la barre.</p>}
    </Card>
  )
}

function tone(freq = 880, dur = 0.15) {
  try {
    const ctx = (tone.ctx ||= new (window.AudioContext || window.webkitAudioContext)())
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = freq
    g.gain.setValueAtTime(0.2, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur)
  } catch { /* no audio */ }
}

const PRESETS = { tabata: { work: 20, rest: 10, rounds: 8 }, hiit: { work: 40, rest: 20, rounds: 10 }, emom: { work: 45, rest: 15, rounds: 12 } }

function IntervalTimer() {
  const [cfg, setCfg] = useState(PRESETS.tabata)
  const [preset, setPreset] = useState('tabata')
  const [state, setState] = useState({ running: false, phase: 'ready', round: 0, left: 0 })
  const ref = useRef(state)
  ref.current = state

  useEffect(() => {
    if (!state.running) return
    const id = setInterval(() => {
      const s = ref.current
      let n
      if (s.left > 1) {
        if (s.left <= 4) tone(660, 0.08)
        n = { ...s, left: s.left - 1 }
      } else if (s.phase === 'work' && s.round >= cfg.rounds) {
        tone(1046, 0.6); n = { running: false, phase: 'done', round: s.round, left: 0 }
      } else if (s.phase === 'work') {
        tone(440, 0.3); n = { ...s, phase: 'rest', left: cfg.rest }
      } else {
        tone(880, 0.3); n = { ...s, phase: 'work', round: s.round + 1, left: cfg.work }
      }
      ref.current = n
      setState(n)
    }, 1000)
    return () => clearInterval(id)
  }, [state.running, cfg])

  const start = () => {
    if (state.phase === 'ready' || state.phase === 'done') { tone(880, 0.3); setState({ running: true, phase: 'work', round: 1, left: cfg.work }) }
    else setState((s) => ({ ...s, running: !s.running }))
  }
  const reset = () => setState({ running: false, phase: 'ready', round: 0, left: 0 })
  const phaseTotal = state.phase === 'work' ? cfg.work : cfg.rest
  const colors = { work: 'rgb(var(--primary))', rest: 'rgb(var(--success))', ready: 'rgb(var(--line))', done: 'rgb(var(--success))' }
  const labels = { work: 'Effort', rest: 'Récup', ready: 'Prêt', done: 'Terminé !' }
  const totalSec = cfg.rounds * (cfg.work + cfg.rest) - cfg.rest

  return (
    <Card className="p-5 sm:p-6 xl:col-span-2">
      <CardHeader icon={TimerReset} title="Minuteur d’intervalles" subtitle={`Durée totale : ${fmtClock(totalSec)}`}
        action={<Segmented size="sm" value={preset} onChange={(p) => { setPreset(p); if (PRESETS[p]) setCfg(PRESETS[p]); reset() }}
          options={[{ value: 'tabata', label: 'Tabata' }, { value: 'hiit', label: 'HIIT' }, { value: 'emom', label: 'EMOM' }]} />} />
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="grid grid-cols-3 gap-3">
          {[['work', 'Effort (s)'], ['rest', 'Récup (s)'], ['rounds', 'Tours']].map(([k, l]) => (
            <Field key={k} label={l} id={`it-${k}`}>
              <input id={`it-${k}`} type="number" min="1" className="input text-center text-lg font-semibold" value={cfg[k]} disabled={state.running}
                onChange={(e) => { setPreset('custom'); setCfg({ ...cfg, [k]: Math.max(1, +e.target.value || 1) }) }} />
            </Field>
          ))}
          <div className="col-span-3 flex gap-2 mt-2">
            <button className="btn-primary btn-lg flex-1" onClick={start}>
              {state.running ? <><Pause size={18} aria-hidden="true" />Pause</> : <><Play size={18} fill="currentColor" aria-hidden="true" />{state.phase === 'ready' || state.phase === 'done' ? 'Démarrer' : 'Reprendre'}</>}
            </button>
            <button className="btn-ghost btn-lg" onClick={reset} aria-label="Réinitialiser"><RotateCcw size={18} /></button>
          </div>
        </div>
        <div className="flex justify-center" aria-live="polite">
          <ProgressRing size={220} stroke={14} value={state.phase === 'work' || state.phase === 'rest' ? state.left / phaseTotal : state.phase === 'done' ? 1 : 0} color={colors[state.phase]}
            label={`${labels[state.phase]}, ${state.left} secondes restantes`}>
            <div>
              <div className="eyebrow" style={{ color: colors[state.phase] }}>{labels[state.phase]}</div>
              <div className="font-display text-6xl font-extrabold tabular leading-none mt-1">{state.phase === 'ready' ? fmtClock(cfg.work) : state.phase === 'done' ? '✓' : fmtClock(state.left)}</div>
              <div className="text-sm text-muted mt-1 tabular">Tour {Math.max(state.round, 0)} / {cfg.rounds}</div>
            </div>
          </ProgressRing>
        </div>
      </div>
    </Card>
  )
}
