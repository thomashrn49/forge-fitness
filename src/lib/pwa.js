import { useEffect, useState } from 'react'
import { useStore } from './store'

// ── Platform ─────────────────────────────────────────────
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
export const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document)
export const isAndroid = /Android/i.test(ua)
export const isMobile = isIOS || isAndroid
export const isIOSSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
export const isStandalone = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) || navigator.standalone === true

// ── Android/Chrome install prompt (captured as early as possible, see main.jsx) ──
let deferredPrompt = null
const listeners = new Set()
export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((l) => l())
  })
}

export function useInstall() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => listeners.delete(l)
  }, [])
  return {
    installed: isStandalone(),
    canPrompt: !!deferredPrompt,
    prompt: async () => {
      if (!deferredPrompt) return false
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      deferredPrompt = null
      force((n) => n + 1)
      return outcome === 'accepted'
    },
  }
}

// ── Keep the screen on during a workout ──
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock = null
    let cancelled = false
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch { /* refused (battery saver…) */ }
      if (cancelled) lock?.release()
    }
    const onVisible = () => document.visibilityState === 'visible' && request()
    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [active])
}

// ── Backup ─────────────────────────────────────────────────────────────
// v2 file = every profile on the device. On iPhone the share sheet lets you "Enregistrer dans Fichiers" → iCloud Drive.
export async function exportBackup() {
  const { allProfiles, updateSettings } = useStore.getState()
  const { accounts, currentId } = allProfiles()
  const profiles = Object.values(accounts).filter((a) => a.profile)
  if (!profiles.length) return { done: false }
  const data = {
    app: 'forge', version: 2, exportedAt: new Date().toISOString(), currentId, accounts,
    summary: profiles.map((a) => ({ name: a.profile.name, workouts: a.workouts?.length || 0, bodyLog: a.bodyLog?.length || 0 })),
  }
  // one permanent file per year: each save replaces it and contains EVERYTHING since the start
  const name = backupFileName()
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  let done = false
  try {
    const file = new File([blob], name, { type: 'application/json' })
    if (isMobile && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sauvegarde FORGE' })
      done = true
    }
  } catch (e) {
    if (e?.name === 'AbortError') return { done: false } // share sheet closed without saving
  }
  if (!done) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const prev = useStore.getState().settings.lastBackupFile
  updateSettings({ lastBackupAt: new Date().toISOString(), lastBackupFile: name, backupSnoozedUntil: null })
  return { done: true, name, previousFile: prev && prev !== name ? prev : null }
}

export const backupFileName = (year = new Date().getFullYear()) => `FORGE-sauvegarde-${year}.json`
// last year's file can be deleted once this year's file exists (it contains everything)
export function yearChange(settings) {
  const f = settings.lastBackupFile
  const m = f && f.match(/(\d{4})\.json$/)
  return m && +m[1] < new Date().getFullYear() ? { oldFile: f, newFile: backupFileName() } : null
}

const isArr = Array.isArray
const validProfile = (a) => a && typeof a === 'object' && a.profile && typeof a.profile.name === 'string' && isArr(a.workouts ?? [])
  && (a.workouts ?? []).every((w) => w && typeof w.startedAt === 'string' && isArr(w.exercises))

/**
 * Read and check a backup file before touching anything.
 * @returns {{ ok: true, kind: 'all'|'single', payload, summary: {name, workouts, bodyLog}[], exportedAt } | { ok: false, error: string }}
 */
export async function parseBackup(file) {
  let data
  try { data = JSON.parse(await file.text()) } catch { return { ok: false, error: 'Ce fichier n’est pas une sauvegarde FORGE (format illisible).' } }
  if (!data || data.app !== 'forge') return { ok: false, error: 'Ce fichier n’est pas une sauvegarde FORGE.' }
  if (data.version === 2) {
    const entries = Object.entries(data.accounts || {}).filter(([, a]) => validProfile(a))
    if (!entries.length) return { ok: false, error: 'La sauvegarde ne contient aucun profil lisible.' }
    const accounts = Object.fromEntries(entries.map(([id, a]) => [id, { workouts: [], templates: [], bodyLog: [], favorites: [], ...a }]))
    return {
      ok: true, kind: 'all', exportedAt: data.exportedAt,
      payload: { accounts, currentId: data.currentId },
      summary: entries.map(([, a]) => ({ name: a.profile.name, workouts: a.workouts?.length || 0, bodyLog: a.bodyLog?.length || 0 })),
    }
  }
  // v1: a single profile (older versions)
  if (!validProfile(data)) return { ok: false, error: 'La sauvegarde est incomplète ou abîmée.' }
  return { ok: true, kind: 'single', exportedAt: data.exportedAt, payload: data, summary: [{ name: data.profile.name, workouts: data.workouts?.length || 0, bodyLog: data.bodyLog?.length || 0 }] }
}
