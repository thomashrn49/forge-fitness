import { useEffect, useId, useRef, useState } from 'react'
import { Search, X, Clock, Sparkles, CornerDownLeft } from 'lucide-react'
import { suggestNames, EXAMPLE_QUERIES } from '../lib/search'
import { MUSCLES } from '../data/exercises'

const RECENT_KEY = 'forge-recent-searches'
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] } catch { return [] } }
export function saveRecent(q) {
  const v = q.trim()
  if (v.length < 2) return
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([v, ...readRecent().filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 6))) } catch { /* storage unavailable */ }
}

/**
 * Search field with French autocomplete.
 * onChange(query) on every keystroke · onOpen(exerciseId) when a suggestion is chosen.
 */
export default function SmartSearch({ value, onChange, onOpen, autoFocus, placeholder = 'Rechercher : pecs, dos sans matériel, squat…' }) {
  const [focus, setFocus] = useState(false)
  const [hi, setHi] = useState(-1)
  const [recent, setRecent] = useState(readRecent)
  const listId = useId()
  const inputRef = useRef(null)
  const sugg = focus ? suggestNames(value, 6) : []
  const showEmpty = focus && !value.trim()

  useEffect(() => setHi(-1), [value])

  const commit = (q) => { saveRecent(q); setRecent(readRecent()) }
  const pick = (ex) => { commit(value); setFocus(false); inputRef.current?.blur(); onOpen?.(ex.id) }
  const runQuery = (q) => { onChange(q); commit(q); inputRef.current?.focus() }

  const onKey = (e) => {
    if (e.key === 'ArrowDown' && sugg.length) { e.preventDefault(); setHi((h) => (h + 1) % sugg.length) }
    else if (e.key === 'ArrowUp' && sugg.length) { e.preventDefault(); setHi((h) => (h <= 0 ? sugg.length - 1 : h - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (hi >= 0 && sugg[hi]) pick(sugg[hi]); else { commit(value); setFocus(false); inputRef.current?.blur() } }
    else if (e.key === 'Escape') { if (value) onChange(''); else { setFocus(false); inputRef.current?.blur() } }
  }

  return (
    <div className="relative">
      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" aria-hidden="true" />
      <input
        ref={inputRef} value={value} autoFocus={autoFocus} data-autofocus={autoFocus || undefined}
        onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
        onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder={placeholder} className="input h-12 pl-11 pr-11"
        role="combobox" aria-expanded={sugg.length > 0 || showEmpty} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={hi >= 0 ? `${listId}-${hi}` : undefined} aria-label="Rechercher un exercice"
        autoComplete="off" spellCheck={false}
      />
      {value && (
        <button type="button" onClick={() => { onChange(''); inputRef.current?.focus() }} className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-lg text-muted hover:text-ink hover:bg-line cursor-pointer" aria-label="Effacer la recherche">
          <X size={16} />
        </button>
      )}

      {(sugg.length > 0 || showEmpty) && (
        <div id={listId} role="listbox" className="absolute z-30 left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-line bg-surface shadow-2xl p-1.5 animate-scale-in">
          {showEmpty ? (
            <div className="p-2 space-y-3" onMouseDown={(e) => e.preventDefault()}>
              {recent.length > 0 && (
                <div>
                  <div className="eyebrow mb-2 flex items-center gap-1.5"><Clock size={12} aria-hidden="true" />Récemment</div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => <button key={r} type="button" className="chip-off h-8" onClick={() => runQuery(r)}>{r}</button>)}
                  </div>
                </div>
              )}
              <div>
                <div className="eyebrow mb-2 flex items-center gap-1.5"><Sparkles size={12} aria-hidden="true" />Essaie par exemple</div>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_QUERIES.map((r) => <button key={r} type="button" className="chip-off h-8" onClick={() => runQuery(r)}>{r}</button>)}
                </div>
              </div>
            </div>
          ) : sugg.map((ex, i) => (
            <button
              key={ex.id} id={`${listId}-${i}`} role="option" aria-selected={hi === i} type="button"
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(ex)} onMouseEnter={() => setHi(i)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer ${hi === i ? 'bg-raised' : ''}`}
            >
              <Search size={14} className="text-faint shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate"><Highlight text={ex.name} query={value} /></span>
                <span className="block text-xs text-muted truncate">{ex.primary.map((m) => MUSCLES[m]).join(', ')} · {ex.equipment}</span>
              </span>
              {hi === i && <CornerDownLeft size={14} className="text-faint shrink-0" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// bold the parts of the name that match query words (accent-insensitive)
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export function Highlight({ text, query }) {
  const words = fold(query).split(/[^a-z0-9]+/).filter((w) => w.length >= 2)
  if (!words.length) return text
  const f = fold(text)
  const marks = new Array(text.length).fill(false)
  for (const w of words) {
    let i = f.indexOf(w)
    while (i >= 0) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = f.indexOf(w, i + 1) }
  }
  const out = []
  let buf = '', cur = marks[0]
  for (let i = 0; i < text.length; i++) {
    if (marks[i] !== cur) { out.push(cur ? <mark key={i} className="bg-transparent text-primary font-semibold">{buf}</mark> : buf); buf = ''; cur = marks[i] }
    buf += text[i]
  }
  out.push(cur ? <mark key="end" className="bg-transparent text-primary font-semibold">{buf}</mark> : buf)
  return out
}
