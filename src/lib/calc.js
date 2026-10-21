import { EX_BY_ID } from '../data/exercises'

export const KCAL_PER_KG_FAT = 7700
const SEC_PER_SET_FALLBACK = 150

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

// ── Dates ────────────────────────────────────────────────
export const dayKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export const startOfWeek = (d) => {
  const x = startOfDay(d)
  const dow = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - dow)
  return x
}
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// ── Formatting ───────────────────────────────────────────
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
export const fmt = (n, digits = 0) => (digits ? nf1 : nf0).format(n || 0)
export const fmtKg = (kg) => (kg >= 1000 ? `${nf1.format(kg / 1000)} t` : `${nf0.format(kg)} kg`)
export const fmtDuration = (sec) => {
  sec = Math.max(0, Math.round(sec || 0))
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  if (h) return `${h} h ${String(m).padStart(2, '0')}`
  return `${m} min`
}
export const fmtClock = (sec) => {
  sec = Math.max(0, Math.floor(sec || 0))
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
export const fmtDate = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(d).toLocaleDateString('fr-FR', opts)
export const relDay = (d) => {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000)
  if (diff === 0) return 'Aujourd’hui'
  if (diff === 1) return 'Hier'
  if (diff < 7) return `Il y a ${diff} jours`
  return fmtDate(d, { day: 'numeric', month: 'short' })
}

// ── Strength ─────────────────────────────────────────────
// Epley estimated one-rep max
export const e1rm = (kg, reps) => {
  if (!kg || !reps) return 0
  if (reps === 1) return kg
  return kg * (1 + Math.min(reps, 15) / 30)
}

export const isDone = (s) => s.done && !s.warmup

export function setVolume(set, ex) {
  if (!isDone(set)) return 0
  if (ex.type === 'weight') return (+set.kg || 0) * (+set.reps || 0)
  if (ex.type === 'bodyweight') return (+set.kg || 0) * (+set.reps || 0)
  return 0
}

// ── Calories (MET method) ────────────────────────────────
// kcal = MET × body weight (kg) × duration (h)
export function workoutCalories(workout, bodyWeight, elapsedSec) {
  const bw = bodyWeight || 75
  const duration = elapsedSec ?? workout.duration ?? 0
  let kcal = 0, cardioSec = 0
  const strength = []
  for (const we of workout.exercises) {
    const ex = EX_BY_ID[we.exId]
    if (!ex) continue
    for (const s of we.sets) {
      if (!s.done) continue
      if (ex.type === 'cardio') {
        const sec = (+s.min || 0) * 60
        cardioSec += sec
        kcal += ex.met * bw * (sec / 3600)
      } else if (ex.type === 'time') {
        // timed effort + typical rest around it
        strength.push({ met: ex.met, w: Math.max(1, (+s.sec || 30) / 45) })
      } else {
        strength.push({ met: ex.met, w: 1 })
      }
    }
  }
  if (strength.length) {
    const totalW = strength.reduce((a, b) => a + b.w, 0)
    let remaining = duration ? Math.max(duration - cardioSec, 0) : 0
    if (!remaining) remaining = totalW * SEC_PER_SET_FALLBACK
    for (const st of strength) kcal += st.met * bw * ((remaining * st.w) / totalW / 3600)
  }
  return Math.round(kcal)
}

export function workoutStats(workout, bodyWeight) {
  let volume = 0, sets = 0, reps = 0
  const muscles = {}
  for (const we of workout.exercises) {
    const ex = EX_BY_ID[we.exId]
    if (!ex) continue
    for (const s of we.sets) {
      if (!isDone(s)) continue
      sets++
      reps += +s.reps || 0
      volume += setVolume(s, ex)
      for (const m of ex.primary) muscles[m] = (muscles[m] || 0) + 1
      for (const m of ex.secondary) muscles[m] = (muscles[m] || 0) + 0.5
    }
  }
  return { volume, sets, reps, muscles, calories: workout.calories ?? workoutCalories(workout, bodyWeight) }
}

// best performance per exercise across a list of workouts
export function computeRecords(workouts) {
  const rec = {}
  for (const w of workouts) {
    for (const we of w.exercises) {
      const ex = EX_BY_ID[we.exId]
      if (!ex) continue
      for (const s of we.sets) {
        if (!isDone(s)) continue
        const r = (rec[we.exId] ||= { e1rm: 0, weight: 0, reps: 0, sec: 0, min: 0, date: null })
        const est = e1rm(+s.kg, +s.reps)
        if (ex.type === 'weight' || (ex.type === 'bodyweight' && +s.kg)) {
          if (est > r.e1rm) { r.e1rm = est; r.date = w.startedAt; r.bestSet = { kg: +s.kg, reps: +s.reps } }
          if (+s.kg > r.weight) r.weight = +s.kg
        }
        if (+s.reps > r.reps) { r.reps = +s.reps; if (ex.type === 'bodyweight' && !r.date) r.date = w.startedAt }
        if (+s.sec > r.sec) { r.sec = +s.sec; r.date = w.startedAt }
        if (+s.min > r.min) r.min = +s.min
      }
    }
  }
  return rec
}

// compare a finished workout against everything before it
export function detectPRs(workout, previous) {
  const before = computeRecords(previous)
  const now = computeRecords([workout])
  const prs = []
  for (const [exId, r] of Object.entries(now)) {
    const ex = EX_BY_ID[exId]
    const b = before[exId]
    if (!b) continue // first time is not a record — it's a baseline
    if (r.e1rm && r.e1rm > b.e1rm * 1.005) prs.push({ exId, kind: 'e1rm', value: Math.round(r.e1rm * 10) / 10, prev: Math.round(b.e1rm * 10) / 10, set: r.bestSet })
    else if (r.weight && r.weight > b.weight) prs.push({ exId, kind: 'weight', value: r.weight, prev: b.weight })
    else if (ex.type === 'bodyweight' && !r.e1rm && r.reps > b.reps) prs.push({ exId, kind: 'reps', value: r.reps, prev: b.reps })
    else if (ex.type === 'time' && r.sec > b.sec) prs.push({ exId, kind: 'sec', value: r.sec, prev: b.sec })
  }
  return prs
}

// last performance of an exercise (for the "previous" column)
export function lastPerformance(workouts, exId) {
  for (let i = workouts.length - 1; i >= 0; i--) {
    const we = workouts[i].exercises.find((e) => e.exId === exId)
    if (we && we.sets.some((s) => s.done)) return we.sets.filter((s) => s.done)
  }
  return null
}

// ── Metabolism ───────────────────────────────────────────
export function bmr(p) {
  if (!p) return 0
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age
  return Math.round(p.sex === 'f' ? base - 161 : base + 5)
}
export const ACTIVITY = [
  { v: 1.2, label: 'Sédentaire', hint: 'Travail de bureau, peu de marche' },
  { v: 1.375, label: 'Légèrement actif', hint: 'Marche quotidienne' },
  { v: 1.55, label: 'Actif', hint: 'Debout une bonne partie de la journée' },
  { v: 1.725, label: 'Très actif', hint: 'Métier physique' },
]
// NEAT-based TDEE (without workouts — we add logged workouts on top)
export const tdee = (p) => Math.round(bmr(p) * (p?.activity || 1.2))
export const bmi = (p) => (p?.height ? p.weight / (p.height / 100) ** 2 : 0)
export function bmiLabel(v) {
  if (!v) return ''
  if (v < 18.5) return 'Insuffisance pondérale'
  if (v < 25) return 'Corpulence normale'
  if (v < 30) return 'Surpoids'
  return 'Obésité'
}

// ── Gamification ─────────────────────────────────────────
export function weekStreak(workouts, target = 3) {
  if (!workouts.length) return 0
  const byWeek = {}
  for (const w of workouts) {
    const k = dayKey(startOfWeek(w.startedAt))
    byWeek[k] = (byWeek[k] || 0) + 1
  }
  let streak = 0
  let wk = startOfWeek(new Date())
  // current week counts if target already reached; otherwise start from last week
  if ((byWeek[dayKey(wk)] || 0) >= target) streak++
  wk = addDays(wk, -7)
  while ((byWeek[dayKey(wk)] || 0) >= target) { streak++; wk = addDays(wk, -7) }
  return streak
}

export function dayStreak(workouts) {
  const days = new Set(workouts.map((w) => dayKey(w.startedAt)))
  let d = startOfDay(new Date())
  if (!days.has(dayKey(d))) d = addDays(d, -1)
  let n = 0
  while (days.has(dayKey(d))) { n++; d = addDays(d, -1) }
  return n
}

export function xpInfo(workouts) {
  let xp = 0
  for (const w of workouts) xp += 100 + Math.round((w.volume || 0) / 100) + (w.prs?.length || 0) * 50
  const level = Math.floor(Math.sqrt(xp / 150)) + 1
  const cur = 150 * (level - 1) ** 2
  const next = 150 * level ** 2
  return { xp, level, progress: (xp - cur) / (next - cur), toNext: next - xp, title: levelTitle(level) }
}
function levelTitle(l) {
  if (l < 3) return 'Recrue'
  if (l < 6) return 'Régulier'
  if (l < 10) return 'Athlète'
  if (l < 15) return 'Machine'
  if (l < 22) return 'Titan'
  return 'Légende'
}

export const BADGES = [
  { id: 'first', name: 'Premier pas', desc: 'Termine ta première séance', icon: 'Footprints', test: (s) => s.count >= 1 },
  { id: 'ten', name: 'Dizaine', desc: '10 séances terminées', icon: 'Medal', test: (s) => s.count >= 10 },
  { id: 'fifty', name: 'Habitué', desc: '50 séances terminées', icon: 'Trophy', test: (s) => s.count >= 50 },
  { id: 'ton', name: 'Tonne', desc: '1 tonne soulevée en une séance', icon: 'Weight', test: (s) => s.maxVolume >= 1000 },
  { id: 'ten-ton', name: 'Bulldozer', desc: '10 tonnes en une séance', icon: 'Truck', test: (s) => s.maxVolume >= 10000 },
  { id: 'pr', name: 'Chasseur de records', desc: 'Bats 10 records personnels', icon: 'Zap', test: (s) => s.prs >= 10 },
  { id: 'streak4', name: 'Discipline', desc: '4 semaines d’affilée à ton objectif', icon: 'Flame', test: (s) => s.streak >= 4 },
  { id: 'burn', name: 'Fournaise', desc: '10 000 kcal brûlées au total', icon: 'Flame', test: (s) => s.kcal >= 10000 },
  { id: 'early', name: 'Lève-tôt', desc: 'Une séance avant 8 h', icon: 'Sunrise', test: (s) => s.early },
  { id: 'marathon', name: 'Endurant', desc: 'Une séance de plus de 90 minutes', icon: 'Timer', test: (s) => s.maxDuration >= 5400 },
]

export function badgeStats(workouts, target) {
  return {
    count: workouts.length,
    maxVolume: Math.max(0, ...workouts.map((w) => w.volume || 0)),
    prs: workouts.reduce((a, w) => a + (w.prs?.length || 0), 0),
    streak: weekStreak(workouts, target),
    kcal: workouts.reduce((a, w) => a + (w.calories || 0), 0),
    early: workouts.some((w) => new Date(w.startedAt).getHours() < 8),
    maxDuration: Math.max(0, ...workouts.map((w) => w.duration || 0)),
  }
}

// muscle fatigue 0..1 from the last 96h (recovery map)
export function muscleFatigue(workouts, now = Date.now()) {
  const f = {}
  for (const w of workouts) {
    const hours = (now - new Date(w.startedAt).getTime()) / 3600000
    if (hours > 96 || hours < 0) continue
    const decay = 1 - hours / 96
    for (const we of w.exercises) {
      const ex = EX_BY_ID[we.exId]
      if (!ex) continue
      const n = we.sets.filter(isDone).length
      if (!n) continue
      for (const m of ex.primary) f[m] = (f[m] || 0) + n * 0.22 * decay
      for (const m of ex.secondary) f[m] = (f[m] || 0) + n * 0.08 * decay
    }
  }
  for (const k in f) f[k] = Math.min(1, f[k])
  return f
}

// ── Progressive overload (double progression) ─────────────────────────────
// Reach the top of the rep range on every work set → add weight and go back to the bottom of the range.
// Otherwise keep the weight and aim for one more rep.
const parseRange = (target) => {
  const m = String(target ?? '').match(/(\d+)(?:\s*[-–à]\s*(\d+))?/)
  if (!m) return null
  const lo = +m[1], hi = m[2] ? +m[2] : +m[1]
  return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) }
}
function loadStep(ex) {
  if (ex.equipment === 'Haltères') return 2
  if (ex.equipment === 'Kettlebell') return 4
  const lower = ex.primary.some((m) => ['quads', 'hamstrings', 'glutes'].includes(m)) || ex.id === 'deadlift'
  if ((ex.equipment === 'Barre' || ex.equipment === 'Machine') && lower && ex.met >= 5.5) return 5
  return 2.5
}

/** @returns {{ kg?, reps?, sec?, kind: 'up'|'reps'|'time', delta: string, reason: string } | null} */
export function suggestProgression(ex, lastSets, target) {
  if (!ex || ex.type === 'cardio' || ex.cat === 'mobility') return null
  const work = (lastSets || []).filter((s) => s.done && !s.warmup)
  if (!work.length) return null
  const range = parseRange(target)
  const frNum = (n) => String(n).replace('.', ',')
  const summary = work.map((s) => (ex.type === 'time' ? `${s.sec}s` : s.kg ? `${frNum(s.kg)}×${s.reps}` : `${s.reps}`)).join(' · ')

  if (ex.type === 'time') {
    const best = Math.max(...work.map((s) => +s.sec || 0))
    return { sec: best + 5, kind: 'time', delta: '+5 s', reason: `Dernière fois : ${summary}` }
  }
  const loaded = work.filter((s) => +s.kg > 0)
  if (ex.type === 'bodyweight' && !loaded.length) {
    const minReps = Math.min(...work.map((s) => +s.reps || 0))
    const maxReps = Math.max(...work.map((s) => +s.reps || 0))
    if (range && minReps >= range.hi) {
      return { kg: 2.5, reps: range.lo, kind: 'up', delta: '+2,5 kg de lest', reason: `Toutes tes séries à ${range.hi} reps : ajoute du lest (ou une variante plus dure).` }
    }
    const goal = range ? Math.min(range.hi, minReps + 1) : maxReps + 1
    return { reps: goal, kind: 'reps', delta: '+1 rep', reason: `Dernière fois : ${summary}. Vise ${goal} reps sur chaque série.` }
  }
  const top = Math.max(...loaded.map((s) => +s.kg))
  const atTop = loaded.filter((s) => +s.kg === top)
  const minReps = Math.min(...atTop.map((s) => +s.reps || 0))
  const hi = range?.hi ?? 12
  const lo = range?.lo ?? Math.max(5, hi - 4)
  if (minReps >= hi) {
    const step = loadStep(ex)
    return { kg: Math.round((top + step) * 4) / 4, reps: lo, kind: 'up', delta: `+${String(step).replace('.', ',')} kg`, reason: `Tu as réussi ${atTop.length}×${minReps} à ${String(top).replace('.', ',')} kg : on monte la charge !` }
  }
  return { kg: top, reps: Math.min(hi, minReps + 1), kind: 'reps', delta: '+1 rep', reason: `Dernière fois : ${summary}. Vise une répétition de plus.` }
}
