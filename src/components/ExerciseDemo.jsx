import { useEffect, useState } from 'react'
import { Pause, Play, Gauge } from 'lucide-react'
import { hasDemo, demoFrame } from '../data/demos'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Mini "video" of the movement: start and end photos played in a loop with a crossfade.
 * Falls back to `fallback` when the exercise has no photos or they cannot be loaded (offline before first view).
 */
export default function ExerciseDemo({ exId, name, fallback = null, className = '' }) {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(() => !reducedMotion())
  const [slow, setSlow] = useState(false)
  const [loaded, setLoaded] = useState(0)
  const [failed, setFailed] = useState(false)
  const available = hasDemo(exId) && !failed

  useEffect(() => { setFrame(0); setLoaded(0); setFailed(false) }, [exId])
  useEffect(() => {
    if (!available || !playing || loaded < 2) return
    const t = setInterval(() => setFrame((f) => 1 - f), slow ? 2200 : 1200)
    return () => clearInterval(t)
  }, [available, playing, slow, loaded])

  if (!available) return fallback

  return (
    <figure className={`relative overflow-hidden rounded-2xl bg-raised select-none ${className}`}>
      <div className="relative aspect-[3/2]">
        {loaded < 2 && <div className="absolute inset-0 animate-pulse bg-raised" aria-hidden="true" />}
        {[0, 1].map((i) => (
          <img
            key={exId + i} src={demoFrame(exId, i)} alt={i === 0 ? `${name} : position de départ` : `${name} : position d’arrivée`}
            onLoad={() => setLoaded((n) => n + 1)} onError={() => setFailed(true)}
            draggable={false} decoding="async"
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-in-out ${frame === i ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <button type="button" onClick={() => setPlaying((p) => !p)} className="absolute inset-0 cursor-pointer" aria-label={playing ? 'Mettre la démo en pause' : 'Lire la démo'} />
        <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-bg/75 backdrop-blur text-[11px] font-bold uppercase tracking-wider pointer-events-none">
          {frame === 0 ? 'Départ' : 'Arrivée'}
        </span>
      </div>
      <figcaption className="absolute bottom-2.5 inset-x-2.5 flex items-center gap-2">
        <button type="button" onClick={() => setPlaying((p) => !p)} className="grid place-items-center size-9 rounded-full bg-bg/80 backdrop-blur text-ink cursor-pointer" aria-label={playing ? 'Pause' : 'Lecture'}>
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>
        <div className="flex gap-1" aria-hidden="true">
          {[0, 1].map((i) => <span key={i} className={`h-1.5 rounded-full transition-all ${frame === i ? 'w-5 bg-primary' : 'w-1.5 bg-ink/50'}`} />)}
        </div>
        <button type="button" onClick={() => setSlow((s) => !s)} aria-pressed={slow}
          className={`ml-auto flex items-center gap-1 h-8 px-2.5 rounded-full backdrop-blur text-xs font-semibold cursor-pointer ${slow ? 'bg-primary text-bg' : 'bg-bg/80 text-ink'}`}>
          <Gauge size={13} aria-hidden="true" />{slow ? 'Lent' : 'Normal'}
        </button>
      </figcaption>
    </figure>
  )
}
