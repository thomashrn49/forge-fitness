import { useEffect, useMemo } from 'react'
import { Trophy, X } from 'lucide-react'

const COLORS = ['#FF6B1A', '#F59E0B', '#22C55E', '#38BDF8', '#F5F7FA']

function fanfare() {
  try {
    const ctx = (fanfare.ctx ||= new (window.AudioContext || window.webkitAudioContext)())
    const t = ctx.currentTime
    ;[523, 659, 784, 1046].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t + i * 0.11)
      g.gain.exponentialRampToValueAtTime(0.22, t + i * 0.11 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + (i === 3 ? 0.5 : 0.16))
      o.connect(g).connect(ctx.destination)
      o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.55)
    })
  } catch { /* audio unavailable */ }
}

/** Celebration shown when a set beats a personal record during the workout. */
export default function PRCelebration({ data, sound = true, onDone }) {
  const pieces = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    dur: 1.4 + Math.random() * 0.9,
    size: 6 + Math.random() * 6,
    color: COLORS[i % COLORS.length],
    round: Math.random() > 0.5,
  })), [data?.id])

  useEffect(() => {
    if (!data) return
    navigator.vibrate?.([60, 40, 60, 40, 180])
    if (sound) fanfare()
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [data?.id])

  if (!data) return null
  return (
    <div className="fixed inset-x-0 top-0 z-[75] pointer-events-none" role="status" aria-live="assertive">
      <div className="absolute inset-x-0 top-0 h-72 overflow-hidden motion-reduce:hidden" aria-hidden="true">
        {pieces.map((p, i) => (
          <span key={i} className="absolute top-0 animate-confetti"
            style={{ left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 0.45, background: p.color, borderRadius: p.round ? 999 : 2, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
        ))}
      </div>
      <div className="relative mx-auto mt-[calc(env(safe-area-inset-top)+16px)] w-[min(92vw,380px)] pointer-events-auto animate-pop-in">
        <div className="card border-warning/60 bg-surface p-4 shadow-2xl flex items-center gap-3">
          <span className="grid place-items-center size-12 rounded-2xl bg-warning text-bg shrink-0 animate-pop"><Trophy size={24} aria-hidden="true" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-warning">Nouveau record !</p>
            <p className="font-display text-xl font-bold uppercase leading-tight truncate">{data.exercise}</p>
            <p className="text-sm text-muted"><span className="text-ink font-semibold tabular">{data.value}</span> · {data.label} <span className="text-success font-semibold">{data.delta}</span></p>
          </div>
          <button className="btn-ghost size-8 rounded-lg shrink-0" onClick={onDone} aria-label="Fermer"><X size={15} /></button>
        </div>
      </div>
    </div>
  )
}
