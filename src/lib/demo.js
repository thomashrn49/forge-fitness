import { TEMPLATE_BY_ID } from '../data/programs'
import { EX_BY_ID } from '../data/exercises'
import { uid, workoutCalories, workoutStats, detectPRs, dayKey, addDays, startOfDay } from './calc'

// Deterministic pseudo-random so the demo looks the same each time
function rng(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

const START_KG = {
  'bench-press': 60, 'incline-db-press': 20, ohp: 37.5, 'lateral-raise': 8, 'triceps-pushdown': 22.5, 'overhead-ext': 16,
  deadlift: 100, 'pull-up': 0, 'barbell-row': 55, 'face-pull': 15, 'barbell-curl': 25, 'hammer-curl': 12,
  squat: 80, rdl: 70, 'leg-press': 140, 'leg-curl': 35, 'calf-raise': 60, 'hanging-leg-raise': 0,
}

export function buildDemo(profile) {
  const rand = rng(42)
  const p = profile || {
    name: 'Alex', sex: 'm', age: 29, height: 180, weight: 82, targetWeight: 77,
    goal: 'lose', level: 2, weeklyTarget: 4, activity: 1.375, intake: 2300,
  }
  const weeks = 10
  const today = startOfDay(new Date())
  const start = addDays(today, -weeks * 7 + 1)
  const rotation = ['ppl-push', 'ppl-pull', 'ppl-legs']
  const workouts = []
  let r = 0
  const startWeight = p.weight + 3.6

  for (let d = 0; d < weeks * 7; d++) {
    const date = addDays(start, d)
    if (date > today) break
    const dow = (date.getDay() + 6) % 7
    const train = [0, 1, 3, 4].includes(dow) ? rand() > 0.12 : dow === 5 ? rand() > 0.7 : false
    const isToday = dayKey(date) === dayKey(today)
    if (!train || isToday) continue
    const progress = d / (weeks * 7)

    // cardio day on Saturdays
    if (dow === 5) {
      const w = makeWorkout(date, 'Cardio long', null, [{ exId: 'incline-walk', sets: [{ min: 30 + Math.round(rand() * 10), km: 3 }] }, { exId: 'rower', sets: [{ min: 12 }] }], 7 + Math.round(rand() * 2), 50 * 60)
      finalize(w, workouts, p.weight)
      continue
    }

    const tpl = TEMPLATE_BY_ID[rotation[r++ % 3]]
    const exercises = tpl.exercises.map((te) => {
      const ex = EX_BY_ID[te.exId]
      const base = START_KG[te.exId] ?? 20
      const inc = ex.type === 'weight' ? Math.max(1.25, base * 0.18) : 0
      const kg = base + inc * Math.floor(progress * 5) / 5 // stepwise overload every ~2 weeks
      const repsTarget = parseInt(te.reps, 10) || 10
      const sets = Array.from({ length: te.sets }, (_, i) => {
        if (ex.type === 'time') return { sec: 45 }
        const reps = Math.max(3, repsTarget - (i > 1 ? 1 : 0) + (rand() > 0.8 ? 1 : 0) - (rand() > 0.85 ? 1 : 0))
        return ex.type === 'bodyweight' ? { reps, kg: '' } : { kg: Math.max(0, Math.round(kg / 1.25) * 1.25), reps }
      })
      return { exId: te.exId, sets, rest: te.rest, target: te.reps }
    })
    const hour = rand() > 0.85 ? 7 : 18
    const w = makeWorkout(date, tpl.name, tpl, exercises, hour + Math.round(rand()), (55 + Math.round(rand() * 25)) * 60)
    finalize(w, workouts, p.weight)
  }

  // body weight: gentle downward trend with daily noise
  const bodyLog = []
  for (let d = 0; d < weeks * 7; d += rand() > 0.5 ? 2 : 3) {
    const date = addDays(start, d)
    if (date > today) break
    const t = d / (weeks * 7)
    bodyLog.push({ id: uid(), date: dayKey(date), weight: Math.round((startWeight - 3.6 * t + (rand() - 0.5) * 0.8) * 10) / 10 })
  }
  bodyLog.push({ id: uid(), date: dayKey(today), weight: p.weight })

  return {
    profile: p,
    workouts,
    bodyLog: dedupe(bodyLog),
    favorites: ['bench-press', 'squat', 'deadlift', 'pull-up'],
    lastProgram: 'ppl',
  }
}

function makeWorkout(date, name, tpl, exercises, hour, duration) {
  const startedAt = new Date(date)
  startedAt.setHours(hour, Math.round(Math.random() * 40), 0, 0)
  return {
    id: uid(), name, templateId: tpl?.id || null, programId: tpl?.programId || null,
    startedAt: startedAt.toISOString(),
    endedAt: new Date(startedAt.getTime() + duration * 1000).toISOString(),
    duration,
    exercises: exercises.map((e) => ({ id: uid(), note: '', ...e, sets: e.sets.map((s) => ({ id: uid(), done: true, warmup: false, ...s })) })),
  }
}

function finalize(w, list, bw) {
  w.calories = workoutCalories(w, bw)
  const st = workoutStats(w, bw)
  w.volume = st.volume
  w.sets = st.sets
  w.prs = detectPRs(w, list)
  list.push(w)
}

const dedupe = (log) => Object.values(Object.fromEntries(log.map((e) => [e.date, e]))).sort((a, b) => a.date.localeCompare(b.date))
