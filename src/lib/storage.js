// Hardened on-device storage for the app state (IndexedDB via idb-keyval).
//
// Guarantees, in order of defence:
// 1. Writes are grouped (debounced) and FORCED to disk as soon as the app goes to the background —
//    iOS can kill a home-screen app at any moment after that.
// 2. A "safe" copy of the last valid state is refreshed every few minutes; if the main record is ever
//    unreadable, the app restarts from it automatically.
// 3. A daily copy (start-of-day state) is kept for the last 5 days, restorable from Profile → Stockage,
//    which also protects against mistakes such as deleting a profile.
// 4. Any write failure is reported to the UI (event `forge-storage-error`) instead of failing silently.
// 5. Data from older versions (localStorage) is migrated once; localStorage is the fallback if IndexedDB is unavailable.
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval'

const DEBOUNCE_MS = 400
const SAFE_EVERY_MS = 5 * 60 * 1000
const DAILY_KEEP = 5

export const storageStatus = {
  recoveredFrom: null, // 'safe' | 'daily' when the main record was unreadable at launch
  lastWriteAt: null,
  lastError: null,
  backend: 'indexeddb',
}

const isValid = (raw) => {
  if (typeof raw !== 'string' || !raw) return false
  try {
    const v = JSON.parse(raw)
    return !!v && typeof v === 'object' && typeof v.state === 'object' && v.state !== null
  } catch { return false }
}
const hasUserData = (raw) => {
  try { const s = JSON.parse(raw).state; return !!(s.profile || Object.keys(s.accounts || {}).length) } catch { return false }
}
const today = () => new Date().toISOString().slice(0, 10)
const emit = (detail) => window.dispatchEvent(new CustomEvent('forge-storage-error', { detail }))

let pending = null // { name, value }
let timer = null
let lastSafeAt = 0
let lastDaily = null
let writing = Promise.resolve()

async function rawWrite(name, value) {
  try {
    await idbSet(name, value)
    storageStatus.backend = 'indexeddb'
  } catch (e) {
    try {
      localStorage.setItem(name, value)
      storageStatus.backend = 'localstorage'
    } catch (e2) {
      storageStatus.lastError = e2?.message || String(e2)
      emit({ message: 'Impossible d’enregistrer sur le téléphone (espace plein ou stockage bloqué).' })
      throw e2
    }
  }
}

async function writeNow() {
  if (!pending) return
  const { name, obj } = pending
  pending = null
  let value
  try { value = JSON.stringify(obj) } catch (e) { storageStatus.lastError = String(e); return }
  clearTimeout(timer)
  timer = null
  writing = writing.then(async () => {
    await rawWrite(name, value)
    storageStatus.lastWriteAt = new Date().toISOString()
    storageStatus.lastError = null
    if (!isValid(value) || !hasUserData(value)) return
    const now = Date.now()
    if (now - lastSafeAt > SAFE_EVERY_MS) {
      lastSafeAt = now
      await idbSet(`${name}:safe`, value).catch(() => {})
    }
    const d = today()
    if (lastDaily !== d) {
      lastDaily = d
      const k = `${name}:daily:${d}`
      if ((await idbGet(k).catch(() => null)) == null) {
        await idbSet(k, value).catch(() => {})
        await pruneDaily(name)
      }
    }
  }).catch(() => {})
  return writing
}

async function pruneDaily(name) {
  try {
    const all = (await idbKeys()).filter((k) => typeof k === 'string' && k.startsWith(`${name}:daily:`)).sort()
    for (const k of all.slice(0, Math.max(0, all.length - DAILY_KEEP))) await idbDel(k)
  } catch { /* ignore */ }
}

/** Write everything still pending right now (called when the app is hidden / closed). */
export function flushStorage() {
  return writeNow()
}

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') writeNow() })
  window.addEventListener('pagehide', () => writeNow())
  window.addEventListener('beforeunload', () => writeNow())
}

// zustand PersistStorage: receives/returns objects, so JSON work is done off the typing path
export const phoneStorage = {
  getItem: async (name) => {
    const raw = await readRaw(name)
    if (raw == null) return null
    try { return JSON.parse(raw) } catch { return null }
  },
  setItem: (name, obj) => {
    pending = { name, obj }
    clearTimeout(timer)
    timer = setTimeout(writeNow, DEBOUNCE_MS)
  },
  removeItem: async (name) => {
    pending = null
    try { await idbDel(name) } catch { /* ignore */ }
    try { localStorage.removeItem(name) } catch { /* ignore */ }
  },
}

async function readRaw(name) {
  try {
    const main = await idbGet(name)
    if (isValid(main)) return main

    // migration from older versions (localStorage)
    const legacy = localStorage.getItem(name)
    if (isValid(legacy)) {
      await idbSet(name, legacy)
      localStorage.removeItem(name)
      return legacy
    }

    // main record missing or damaged → automatic recovery from the internal copies
    if (main != null) {
      const safe = await idbGet(`${name}:safe`)
      if (isValid(safe)) { storageStatus.recoveredFrom = 'safe'; await idbSet(name, safe); return safe } // repair the main record right away
      const dailies = (await idbKeys()).filter((k) => typeof k === 'string' && k.startsWith(`${name}:daily:`)).sort().reverse()
      for (const k of dailies) {
        const v = await idbGet(k)
        if (isValid(v)) { storageStatus.recoveredFrom = 'daily'; await idbSet(name, v); return v }
      }
    }
    return null
  } catch {
    storageStatus.backend = 'localstorage'
    try { return localStorage.getItem(name) } catch { return null }
  }
}

const REASONS = { import: 'Avant restauration', reset: 'Avant suppression de profil', delete: 'Avant suppression de profil', demo: 'Avant chargement de la démo', snapshot: 'Avant retour à une copie' }

/** Copy the current data aside right before a destructive action (kept: last 5). */
export async function snapshotNow(name, reason) {
  await writeNow()
  await writing
  try {
    const raw = await idbGet(name)
    if (!isValid(raw) || !hasUserData(raw)) return
    await idbSet(`${name}:before:${Date.now()}:${reason}`, raw)
    const all = (await idbKeys()).filter((k) => typeof k === 'string' && k.startsWith(`${name}:before:`)).sort()
    for (const k of all.slice(0, Math.max(0, all.length - 5))) await idbDel(k)
  } catch { /* ignore */ }
}

/** Internal automatic copies, newest first: [{ key, label, date, workouts, profiles }] */
export async function listSnapshots(name) {
  const out = []
  try {
    const all = (await idbKeys()).filter((k) => typeof k === 'string' && (k === `${name}:safe` || k.startsWith(`${name}:daily:`) || k.startsWith(`${name}:before:`)))
    for (const k of all) {
      const raw = await idbGet(k)
      if (!isValid(raw)) continue
      const s = JSON.parse(raw).state
      // the logged-in profile lives at the top level; `accounts` may also hold an older copy of it
      const others = Object.entries(s.accounts || {}).filter(([id, a]) => a.profile && id !== s.currentId).map(([, a]) => a)
      const names = new Set(others.map((a) => a.profile.name))
      if (s.profile) names.add(s.profile.name)
      const workouts = (s.workouts?.length || 0) + others.reduce((t, a) => t + (a.workouts?.length || 0), 0)
      const before = k.includes(':before:')
      const [, , ts, reason] = before ? k.split(':') : []
      out.push({
        key: k,
        kind: k.endsWith(':safe') ? 'safe' : before ? 'before' : 'daily',
        date: before ? new Date(+ts).toISOString() : k.endsWith(':safe') ? null : k.split(':daily:')[1],
        label: before ? REASONS[reason] || 'Avant une action' : null,
        profiles: [...names],
        workouts,
      })
    }
  } catch { /* ignore */ }
  const rank = { safe: 0, before: 1, daily: 2 }
  return out.sort((a, b) => rank[a.kind] - rank[b.kind] || b.date.localeCompare(a.date))
}

/** Replace the current data with an internal copy, then restart the app. */
export async function restoreSnapshot(name, key) {
  const raw = await idbGet(key)
  if (!isValid(raw)) throw new Error('Copie illisible')
  await snapshotNow(name, 'snapshot')
  pending = null
  clearTimeout(timer)
  await writing
  await idbSet(name, raw)
  window.location.reload()
}

/** Size used on the device and whether the system promised not to evict it. */
export async function storageHealth() {
  const est = await navigator.storage?.estimate?.().catch(() => null)
  const persisted = await navigator.storage?.persisted?.().catch(() => null)
  return { usage: est?.usage ?? null, quota: est?.quota ?? null, persisted }
}
