import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 animate-fade-up">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-4xl sm:text-5xl font-bold uppercase leading-none">{title}</h1>
        {subtitle && <p className="text-muted mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

export function Card({ className = '', children, as: Tag = 'section', ...rest }) {
  return <Tag className={`card ${className}`} {...rest}>{children}</Tag>
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="grid place-items-center size-9 rounded-xl bg-raised text-primary shrink-0">
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold uppercase leading-tight truncate">{title}</h2>
          {subtitle && <p className="text-sm text-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function StatTile({ icon: Icon, label, value, unit, sub, tone = 'primary', delay = 0 }) {
  const tones = {
    primary: 'text-primary bg-primary/12',
    success: 'text-success bg-success/12',
    info: 'text-info bg-info/12',
    warning: 'text-warning bg-warning/12',
    danger: 'text-danger bg-danger/12',
  }
  return (
    <div className="card p-4 sm:p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        {Icon && (
          <span className={`grid place-items-center size-8 rounded-lg ${tones[tone]}`}>
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-bold tabular leading-none">{value}</span>
        {unit && <span className="text-muted font-medium">{unit}</span>}
      </div>
      {sub && <div className="mt-2 text-sm text-muted">{sub}</div>}
    </div>
  )
}

export function ProgressRing({ value, size = 120, stroke = 10, children, color = 'rgb(var(--primary))', track = 'rgb(var(--raised))', label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value || 0))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Segmented({ options, value, onChange, size = 'md', className = '' }) {
  return (
    <div role="tablist" className={`inline-flex p-1 rounded-xl bg-raised border border-line ${className}`}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value} role="tab" aria-selected={active} type="button"
            onClick={() => onChange(o.value)}
            className={`${size === 'sm' ? 'h-8 px-3 text-sm' : 'h-9 px-4 text-[15px]'} rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${active ? 'bg-primary text-bg' : 'text-muted hover:text-ink'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      {Icon && (
        <span className="grid place-items-center size-14 rounded-2xl bg-raised text-primary mb-4">
          <Icon size={26} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-2xl font-bold uppercase">{title}</h3>
      {text && <p className="text-muted mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, size = 'md', labelledBy }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const dialogs = document.querySelectorAll('[role=dialog][aria-modal=true]')
      if (dialogs[dialogs.length - 1] === ref.current) closeRef.current?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.querySelector('[data-autofocus], input, button')?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (document.querySelectorAll('[role=dialog][aria-modal=true]').length <= 1) document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open])
  if (!open) return null
  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fade-up_.2s_ease_both]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title}
        className={`relative w-full ${widths[size]} max-h-[92dvh] flex flex-col bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-scale-in`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-2xl font-bold uppercase leading-tight">{title}</h2>
          <button onClick={onClose} className="btn-ghost size-10 rounded-full" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, hint, children, id }) {
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      {children}
      {hint && <p className="text-xs text-muted mt-1.5">{hint}</p>}
    </div>
  )
}

export function LevelDots({ level }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Niveau ${level} sur 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 w-3 rounded-full ${i <= level ? 'bg-primary' : 'bg-line'}`} />
      ))}
    </span>
  )
}

export function ChartTooltip({ active, payload, label, format = (v) => v, labelFormat = (l) => l }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-bg/95 px-3 py-2 shadow-xl text-sm">
      <div className="text-muted mb-0.5">{labelFormat(label, payload[0]?.payload)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 font-semibold text-ink tabular">
          <span className="size-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} aria-hidden="true" />
          {format(p.value, p)}
        </div>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition cursor-pointer ${checked ? 'bg-primary' : 'bg-line'}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-ink transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}
