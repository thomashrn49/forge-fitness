import { memo } from 'react'
import { MUSCLES } from '../data/exercises'

// Stylised anatomical figure. `levels` maps muscle id → intensity 0..1.
// Shapes are drawn for the left half and mirrored for the right.

const FRONT = {
  shoulders: [<ellipse key="d" cx="34" cy="47" rx="8" ry="8.5" />],
  chest: [<path key="c" d="M44 40 C51 38 57 39 59 41 L59 60 C53 64 46 63 41 58 C39 52 40 45 44 40 Z" />],
  biceps: [<ellipse key="b" cx="28.5" cy="67" rx="5.5" ry="11.5" transform="rotate(8 28.5 67)" />],
  forearms: [<ellipse key="f" cx="23.5" cy="93" rx="4.8" ry="13" transform="rotate(10 23.5 93)" />],
  obliques: [<path key="o" d="M42 62 C45 64 47 65 49 66 L49 100 C46 99 43 96 42 92 C40 82 40 70 42 62 Z" />],
  quads: [<ellipse key="q" cx="48.5" cy="139" rx="8.5" ry="25" />],
  adductors: [<ellipse key="a" cx="57.2" cy="125" rx="2.8" ry="12" />],
  calves: [<ellipse key="cv" cx="48" cy="192" rx="5.5" ry="17" />],
}
const FRONT_CENTER = {
  abs: [<rect key="ab" x="50.5" y="64" width="19" height="40" rx="6" />],
}
const BACK = {
  shoulders: [<ellipse key="d" cx="34" cy="47" rx="8" ry="8.5" />],
  back: [<path key="l" d="M41 50 L52 50 L59 60 L59 94 C53 97 47 96 44 92 C40 80 39 62 41 50 Z" />],
  triceps: [<ellipse key="t" cx="28.5" cy="67" rx="5.5" ry="11.5" transform="rotate(8 28.5 67)" />],
  forearms: [<ellipse key="f" cx="23.5" cy="93" rx="4.8" ry="13" transform="rotate(10 23.5 93)" />],
  glutes: [<ellipse key="g" cx="51" cy="117" rx="9.5" ry="10" />],
  hamstrings: [<ellipse key="h" cx="49" cy="148" rx="8" ry="19" />],
  calves: [<ellipse key="cv" cx="48" cy="190" rx="6.5" ry="15" />],
}
const BACK_CENTER = {
  traps: [<path key="tr" d="M50 31 L70 31 L80 42 L68 50 L60 60 L52 50 L40 42 Z" />],
  lowerback: [<rect key="lb" x="51" y="93" width="18" height="13" rx="5" />],
}

function Neutral() {
  return (
    <g fill="rgb(var(--line))">
      <circle cx="60" cy="17" r="10.5" />
      <rect x="55" y="26" width="10" height="7" rx="3" />
      <path d="M46 104 L74 104 L72 113 L60 119 L48 113 Z" />
      {[0, 1].map((m) => (
        <g key={m} transform={m ? 'translate(120 0) scale(-1 1)' : undefined}>
          <circle cx="20" cy="110" r="4" />
          <ellipse cx="48.5" cy="169" rx="5" ry="4" />
          <ellipse cx="48" cy="215" rx="6.5" ry="3.5" />
        </g>
      ))}
    </g>
  )
}

function fillFor(v) {
  if (!v) return 'rgb(var(--raised))'
  return `rgb(var(--primary) / ${0.28 + 0.72 * Math.min(1, v)})`
}

function Figure({ shapes, center, levels, label }) {
  const draw = (id, els, mirror) => (
    <g key={id + (mirror ? 'r' : 'l')} fill={fillFor(levels[id])} stroke="rgb(var(--bg))" strokeWidth="1.2"
       transform={mirror ? 'translate(120 0) scale(-1 1)' : undefined} className="transition-[fill] duration-500">
      <title>{MUSCLES[id]}{levels[id] ? '' : ' — non sollicité'}</title>
      {els}
    </g>
  )
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 120 225" className="w-full h-auto max-h-[300px]" role="img" aria-label={label}>
        <Neutral />
        {Object.entries(shapes).flatMap(([id, els]) => [draw(id, els, false), draw(id, els, true)])}
        {Object.entries(center).map(([id, els]) => draw(id, els, false))}
        {center.abs && (
          <g stroke="rgb(var(--bg))" strokeWidth="1.2" opacity=".9">
            <line x1="60" y1="66" x2="60" y2="102" />
            <line x1="51" y1="76" x2="69" y2="76" /><line x1="51" y1="87" x2="69" y2="87" />
          </g>
        )}
      </svg>
      <figcaption className="eyebrow mt-1">{label}</figcaption>
    </figure>
  )
}

function BodyMap({ levels = {}, primary, secondary, className = '' }) {
  const lv = { ...levels }
  secondary?.forEach((m) => (lv[m] = Math.max(lv[m] || 0, 0.35)))
  primary?.forEach((m) => (lv[m] = 1))
  const active = Object.entries(lv).filter(([, v]) => v > 0).map(([k]) => MUSCLES[k])
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2">
        <Figure shapes={FRONT} center={FRONT_CENTER} levels={lv} label="Face" />
        <Figure shapes={BACK} center={BACK_CENTER} levels={lv} label="Dos" />
      </div>
      <p className="sr-only">Muscles sollicités : {active.join(', ') || 'aucun'}</p>
    </div>
  )
}

export default memo(BodyMap)
