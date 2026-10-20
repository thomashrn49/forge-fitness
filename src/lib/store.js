import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { phoneStorage } from './storage'
import { EX_BY_ID } from '../data/exercises'
import { uid, workoutCalories, workoutStats, detectPRs, lastPerformance, dayKey } from './calc'
import { buildDemo } from './demo'

export function newSet(ex, prev) {
  const base = { id: uid(), done: false, warmup: false }
  if (ex.type === 'cardio') return { ...base, min: prev?.min ?? 20, km: prev?.km ?? '' }
  if (ex.type === 'time') return { ...base, sec: prev?.sec ?? 30 }
  if (ex.type === 'bodyweight') return { ...base, reps: prev?.reps ?? 10, kg: prev?.kg ?? '' }
  return { ...base, kg: prev?.kg ?? '', reps: prev?.reps ?? 10 }
}

function buildExercise(exId, history, { sets = 3, reps, rest } = {}) {
  const ex = EX_BY_ID[exId]
  const last = lastPerformance(history, exId)
  const targetReps = parseInt(reps, 10)
  const list = Array.from({ length: sets }, (_, i) => {
    const prev = last?.[i] ?? last?.[last.length - 1]
    const s = newSet(ex, prev)
    if (!prev && targetReps && 'reps' in s) s.reps = targetReps
    if (!prev && targetReps && ex.type === 'time') s.sec = targetReps
    if (!prev && targetReps && ex.type === 'cardio') s.min = targetReps
    return s
  })
  return { id: uid(), exId, sets: list, rest, target: reps, note: '' }
}

// Per-profile data. The logged-in profile lives at the top level; others are kept as snapshots in `accounts`.
const DATA_KEYS = ['profile', 'workouts', 'active', 'templates', 'bodyLog', 'favorites', 'settings', 'lastProgram']
const DEFAULT_SETTINGS = { rest: 90, sound: true, plates: [25, 20, 15, 10, 5, 2.5, 1.25], bar: 20, lastBackupAt: null, lastBackupFile: null, backupHelpSeen: false, backupSnoozedUntil: null, backupEvery: 7, backupAfterWorkout: true }
const EMPTY = () => ({ profile: null, workouts: [], active: null, templates: [], bodyLog: [], favorites: [], settings: { ...DEFAULT_SETTINGS }, lastProgram: null })
export const STORE_KEY = 'forge-fitness-v1'
// Merge two copies of the same profile: nothing already on the phone is lost, missing items are added.
const byKey = (list = [], key) => new Map(list.map((x) => [x[key], x]))
export function mergeProfileData(local, incoming) {
  if (!local?.profile) return { ...incoming }
  const w = byKey(local.workouts, 'id'); for (const x of incoming.workouts || []) if (!w.has(x.id)) w.set(x.id, x)
  const b = byKey(local.bodyLog, 'date'); for (const x of incoming.bodyLog || []) if (!b.has(x.date)) b.set(x.date, x)
  const t = byKey(local.templates, 'id'); for (const x of incoming.templates || []) if (!t.has(x.id)) t.set(x.id, x)
  return {
    ...local,
    workouts: [...w.values()].sort((a, c) => a.startedAt.localeCompare(c.startedAt)),
    bodyLog: [...b.values()].sort((a, c) => a.date.localeCompare(c.date)),
    templates: [...t.values()],
    favorites: [...new Set([...(local.favorites || []), ...(incoming.favorites || [])])],
  }
}

const snapshot = (s) => Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]]))
const withSaved = (s) => (s.currentId && s.profile ? { ...s.accounts, [s.currentId]: { ...snapshot(s), updatedAt: new Date().toISOString() } } : s.accounts)

const updateActive = (state, fn) => (state.active ? { active: fn(structuredClone(state.active)) } : {})

export const useStore = create(
  persist(
    (set, get) => ({
      profile: null,
      workouts: [],
      active: null,
      templates: [],
      bodyLog: [],
      favorites: [],
      settings: { ...DEFAULT_SETTINGS },
      lastProgram: null,
      accounts: {},
      currentId: null,

      // ── accounts
      logout: () => set((s) => ({ ...EMPTY(), accounts: withSaved(s), currentId: null })),
      switchProfile: (id) => set((s) => {
        const accounts = withSaved(s)
        const data = accounts[id]
        if (!data) return {}
        return { ...EMPTY(), ...snapshot(data), settings: { ...DEFAULT_SETTINGS, ...data.settings }, accounts, currentId: id }
      }),
      deleteProfile: (id) => set((s) => {
        const accounts = { ...s.accounts }
        delete accounts[id]
        return s.currentId === id ? { ...EMPTY(), accounts, currentId: null } : { accounts }
      }),

      // ── profile
      setProfile: (p) => set((s) => {
        const profile = { ...s.profile, ...p }
        const bodyLog = [...s.bodyLog]
        if (p.weight && (!s.profile || p.weight !== s.profile.weight)) {
          const today = dayKey(new Date())
          const i = bodyLog.findIndex((e) => e.date === today)
          if (i >= 0) bodyLog[i] = { ...bodyLog[i], weight: +p.weight }
          else bodyLog.push({ id: uid(), date: today, weight: +p.weight })
        }
        return { profile, bodyLog: bodyLog.sort((a, b) => a.date.localeCompare(b.date)), currentId: s.currentId || uid() }
      }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ── body log
      addBodyEntry: ({ date, weight, bodyFat, waist }) => set((s) => {
        const rest = s.bodyLog.filter((e) => e.date !== date)
        const bodyLog = [...rest, { id: uid(), date, weight: +weight, bodyFat: bodyFat ? +bodyFat : undefined, waist: waist ? +waist : undefined }]
          .sort((a, b) => a.date.localeCompare(b.date))
        const latest = bodyLog[bodyLog.length - 1]
        return { bodyLog, profile: s.profile ? { ...s.profile, weight: latest.weight } : s.profile }
      }),
      deleteBodyEntry: (id) => set((s) => ({ bodyLog: s.bodyLog.filter((e) => e.id !== id) })),

      toggleFavorite: (exId) => set((s) => ({
        favorites: s.favorites.includes(exId) ? s.favorites.filter((f) => f !== exId) : [...s.favorites, exId],
      })),

      // ── active workout
      startWorkout: (template) => {
        const { workouts, active } = get()
        if (active) return active.id
        const w = {
          id: uid(),
          name: template?.name || 'Séance libre',
          templateId: template?.id || null,
          programId: template?.programId || null,
          startedAt: new Date().toISOString(),
          exercises: (template?.exercises || []).map((e) => buildExercise(e.exId, workouts, e)),
          restEndsAt: null,
          restTotal: 0,
        }
        set({ active: w, lastProgram: template?.programId ?? get().lastProgram })
        return w.id
      },
      repeatWorkout: (workoutId) => {
        const src = get().workouts.find((w) => w.id === workoutId)
        if (!src) return
        return get().startWorkout({
          id: src.templateId, programId: src.programId, name: src.name,
          exercises: src.exercises.map((e) => ({ exId: e.exId, sets: e.sets.filter((s) => s.done).length || 3, reps: e.target, rest: e.rest })),
        })
      },
      renameActive: (name) => set((s) => updateActive(s, (a) => ({ ...a, name }))),
      addExercises: (ids) => set((s) => updateActive(s, (a) => ({
        ...a, exercises: [...a.exercises, ...ids.map((id) => buildExercise(id, s.workouts, { sets: EX_BY_ID[id].type === 'cardio' ? 1 : 3 }))],
      }))),
      removeExercise: (weId) => set((s) => updateActive(s, (a) => ({ ...a, exercises: a.exercises.filter((e) => e.id !== weId) }))),
      moveExercise: (weId, dir) => set((s) => updateActive(s, (a) => {
        const i = a.exercises.findIndex((e) => e.id === weId), j = i + dir
        if (i < 0 || j < 0 || j >= a.exercises.length) return a
        const ex = [...a.exercises];[ex[i], ex[j]] = [ex[j], ex[i]]
        return { ...a, exercises: ex }
      })),
      setNote: (weId, note) => set((s) => updateActive(s, (a) => {
        a.exercises.find((e) => e.id === weId).note = note
        return a
      })),
      addSet: (weId) => set((s) => updateActive(s, (a) => {
        const we = a.exercises.find((e) => e.id === weId)
        const prev = we.sets[we.sets.length - 1]
        we.sets.push({ ...newSet(EX_BY_ID[we.exId], prev) })
        return a
      })),
      updateSet: (weId, setId, patch) => set((s) => updateActive(s, (a) => {
        const st = a.exercises.find((e) => e.id === weId).sets.find((x) => x.id === setId)
        Object.assign(st, patch)
        return a
      })),
      removeSet: (weId, setId) => set((s) => updateActive(s, (a) => {
        const we = a.exercises.find((e) => e.id === weId)
        we.sets = we.sets.filter((x) => x.id !== setId)
        return a
      })),
      toggleSet: (weId, setId) => {
        let startRest = 0
        set((s) => updateActive(s, (a) => {
          const we = a.exercises.find((e) => e.id === weId)
          const st = we.sets.find((x) => x.id === setId)
          st.done = !st.done
          if (st.done && !st.warmup && EX_BY_ID[we.exId].type !== 'cardio') startRest = we.rest || s.settings.rest
          if (startRest) { a.restEndsAt = Date.now() + startRest * 1000; a.restTotal = startRest }
          return a
        }))
        return startRest
      },
      setRest: (endsAt, total) => set((s) => updateActive(s, (a) => ({ ...a, restEndsAt: endsAt, restTotal: total ?? a.restTotal }))),

      finishWorkout: () => {
        const { active, workouts, profile } = get()
        if (!active) return null
        const exercises = active.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
          .filter((e) => e.sets.length)
        if (!exercises.length) return null
        const endedAt = new Date()
        const w = {
          id: active.id, name: active.name, templateId: active.templateId, programId: active.programId,
          startedAt: active.startedAt, endedAt: endedAt.toISOString(),
          duration: Math.round((endedAt - new Date(active.startedAt)) / 1000),
          exercises,
        }
        w.calories = workoutCalories(w, profile?.weight)
        const st = workoutStats(w, profile?.weight)
        w.volume = st.volume
        w.sets = st.sets
        w.prs = detectPRs(w, workouts)
        set({ workouts: [...workouts, w].sort((a, b) => a.startedAt.localeCompare(b.startedAt)), active: null })
        return w.id
      },
      discardWorkout: () => set({ active: null }),
      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      // ── custom templates
      saveTemplate: (tpl) => set((s) => {
        const t = { ...tpl, id: tpl.id || 'custom-' + uid(), custom: true }
        const templates = s.templates.some((x) => x.id === t.id)
          ? s.templates.map((x) => (x.id === t.id ? t : x))
          : [...s.templates, t]
        return { templates }
      }),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      // ── data
      loadDemo: (profileOverride) => {
        const demo = buildDemo(profileOverride || get().profile)
        set((s) => ({ ...demo, active: null, currentId: s.currentId || uid() }))
      },
      importData: (data) => set((s) => ({
        currentId: s.currentId || uid(),
        profile: data.profile ?? null, workouts: data.workouts ?? [], templates: data.templates ?? [],
        bodyLog: data.bodyLog ?? [], favorites: data.favorites ?? [], settings: { ...DEFAULT_SETTINGS, ...data.settings }, active: null,
      })),
      // every profile on this device (the logged-in one included), for a complete backup
      allProfiles: () => {
        const s = get()
        const accounts = withSaved(s)
        return { currentId: s.currentId, accounts }
      },
      // merge a backup into this phone: profiles are matched by id; nothing on the phone is removed
      mergeBackup: (parsed) => set((s) => {
        const accounts = { ...withSaved(s) }
        let currentId = s.currentId
        if (parsed.kind === 'all') {
          for (const [id, inc] of Object.entries(parsed.payload.accounts)) accounts[id] = mergeProfileData(accounts[id], inc)
          if (!currentId) currentId = parsed.payload.currentId && accounts[parsed.payload.currentId] ? parsed.payload.currentId : Object.keys(accounts)[0]
        } else {
          const id = currentId || uid()
          accounts[id] = mergeProfileData(accounts[id], parsed.payload)
          currentId = id
        }
        const data = accounts[currentId]
        return { ...EMPTY(), ...snapshot(data), settings: { ...DEFAULT_SETTINGS, ...s.settings, ...(s.profile ? {} : data.settings) }, accounts, currentId }
      }),
      // restore a v2 backup: replaces every profile on this device, then opens the one that was active
      restoreAll: ({ accounts, currentId }) => set(() => {
        const id = currentId && accounts[currentId] ? currentId : Object.keys(accounts)[0]
        const data = accounts[id]
        return { ...EMPTY(), ...snapshot(data), settings: { ...DEFAULT_SETTINGS, ...data.settings }, accounts, currentId: id }
      }),
      // wipes the current profile entirely (data + account entry)
      resetAll: () => set((s) => {
        const accounts = { ...s.accounts }
        delete accounts[s.currentId]
        return { ...EMPTY(), accounts, currentId: null }
      }),
    }),
    {
      name: STORE_KEY,
      version: 2,
      storage: phoneStorage,
      // v1 had a single profile without id
      migrate: (state, version) => (version < 2 ? { ...state, accounts: {}, currentId: state.profile ? uid() : null } : state),
    },
  ),
)
