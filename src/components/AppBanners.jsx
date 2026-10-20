import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, RefreshCw, Smartphone, X, ShieldCheck, Share, SquarePlus, MoreVertical, CheckCircle2, WifiOff } from 'lucide-react'
import { useStore } from '../lib/store'
import { useInstall, isIOS, isAndroid, isMobile, isIOSSafari, exportBackup, yearChange } from '../lib/pwa'
import BackupButton from './BackupButton'

const DISMISS_KEY = 'forge-install-dismissed'
const readDismissed = () => { try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false } }

// "A new version is available" — never reloads by itself (a workout might be in progress)
export function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], offlineReady: [offlineReady, setOfflineReady], updateServiceWorker } = useRegisterSW()
  if (!needRefresh && !offlineReady) return null
  return (
    <div className="fixed z-[70] left-3 right-3 top-[calc(env(safe-area-inset-top)+12px)] sm:left-auto sm:right-6 sm:w-96 animate-fade-up" role="status">
      <div className="card p-4 flex items-start gap-3 shadow-2xl">
        <span className={`grid place-items-center size-10 rounded-xl shrink-0 ${needRefresh ? 'bg-primary/15 text-primary' : 'bg-success/15 text-success'}`}>
          {needRefresh ? <RefreshCw size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{needRefresh ? 'Nouvelle version disponible' : 'Prêt hors ligne'}</p>
          <p className="text-sm text-muted">{needRefresh ? 'Mets à jour quand tu veux, tes données sont conservées.' : 'FORGE fonctionne maintenant sans connexion.'}</p>
          {needRefresh && <button className="btn-primary btn-sm mt-3" onClick={() => updateServiceWorker(true)}>Mettre à jour</button>}
        </div>
        <button className="btn-ghost size-8 rounded-lg shrink-0" onClick={() => { setNeedRefresh(false); setOfflineReady(false) }} aria-label="Fermer"><X size={15} /></button>
      </div>
    </div>
  )
}

// Dashboard banner on phones when the app is not installed yet
export function InstallBanner() {
  const { installed, canPrompt, prompt } = useInstall()
  const [hidden, setHidden] = useState(readDismissed)
  if (installed || hidden || !(isMobile || canPrompt)) return null
  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ } setHidden(true) }
  return (
    <div className="card p-4 flex items-center gap-3 border-primary/40 bg-gradient-to-r from-primary/15 to-surface animate-fade-up">
      <span className="grid place-items-center size-11 rounded-xl bg-primary text-bg shrink-0"><Smartphone size={20} aria-hidden="true" /></span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">Installe FORGE sur ton téléphone</p>
        <p className="text-sm text-muted">Icône sur l’écran d’accueil, plein écran, fonctionne sans réseau.</p>
      </div>
      {canPrompt
        ? <button className="btn-primary btn-sm shrink-0" onClick={prompt}><Download size={15} aria-hidden="true" />Installer</button>
        : <Link to="/installer" className="btn-primary btn-sm shrink-0">Comment ?</Link>}
      <button className="btn-ghost size-8 rounded-lg shrink-0" onClick={dismiss} aria-label="Ne plus afficher"><X size={15} /></button>
    </div>
  )
}

// Reminder to export: data lives only on this phone
export function BackupReminder() {
  const { workouts, settings, updateSettings } = useStore()
  const every = settings.backupEvery ?? 7
  const year = yearChange(settings)
  if (workouts.length < 3 || (every === 0 && !year)) return null
  const now = Date.now()
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : 0
  const snoozed = settings.backupSnoozedUntil && new Date(settings.backupSnoozedUntil).getTime() > now
  const days = last ? Math.floor((now - last) / 86400000) : null
  if (!year && (snoozed || (days !== null && days < every))) return null
  return (
    <div className="card p-4 flex flex-wrap items-center gap-3 border-info/40 animate-fade-up">
      <span className="grid place-items-center size-11 rounded-xl bg-info/15 text-info shrink-0"><ShieldCheck size={20} aria-hidden="true" /></span>
      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold">{year ? `Nouvelle année : crée ta sauvegarde ${new Date().getFullYear()}` : days === null ? 'Sauvegarde ta progression' : `Dernière sauvegarde il y a ${days} jours`}</p>
        <p className="text-sm text-muted">{year ? `Elle contiendra tout. Une fois faite, tu pourras supprimer ${year.oldFile} de iCloud Drive.` : 'Tes données sont uniquement sur ce téléphone. Mets à jour ton fichier de sauvegarde dans iCloud Drive pour les protéger.'}</p>
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost btn-sm" onClick={() => updateSettings({ backupSnoozedUntil: new Date(now + 2 * 86400000).toISOString() })}>Plus tard</button>
        <BackupButton className="btn-primary btn-sm" label="Sauvegarder" />
      </div>
    </div>
  )
}

// Global alert when the phone refuses to save (storage full / blocked)
export function StorageAlert() {
  const [err, setErr] = useState(null)
  useEffect(() => {
    const on = (e) => setErr(e.detail?.message || 'Enregistrement impossible.')
    window.addEventListener('forge-storage-error', on)
    return () => window.removeEventListener('forge-storage-error', on)
  }, [])
  if (!err) return null
  return (
    <div className="fixed z-[80] left-3 right-3 top-[calc(env(safe-area-inset-top)+12px)] sm:left-auto sm:right-6 sm:w-96 animate-fade-up" role="alert">
      <div className="card p-4 border-danger/50 bg-surface shadow-2xl">
        <p className="font-semibold text-danger">Attention : enregistrement impossible</p>
        <p className="text-sm text-muted mt-1">{err} Libère de l’espace sur ton téléphone, puis fais une sauvegarde depuis Profil → Stockage.</p>
        <div className="flex gap-2 mt-3">
          <button className="btn-primary btn-sm" onClick={() => exportBackup()}><Download size={15} aria-hidden="true" />Sauvegarder maintenant</button>
          <button className="btn-ghost btn-sm" onClick={() => setErr(null)}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// Full step-by-step guide (page /installer and profile)
export function InstallGuide() {
  const { installed, canPrompt, prompt } = useInstall()
  const [tab, setTab] = useState(isIOS ? 'ios' : 'android')

  if (installed) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/30">
        <CheckCircle2 size={22} className="text-success shrink-0" aria-hidden="true" />
        <p><span className="font-semibold">FORGE est installée.</span> <span className="text-muted">Tu l’utilises en mode application, tes données sont stockées sur ce téléphone.</span></p>
      </div>
    )
  }

  const Step = ({ n, icon: Icon, children }) => (
    <li className="flex gap-3 items-start">
      <span className="grid place-items-center size-8 rounded-full bg-primary/15 text-primary font-display font-bold shrink-0">{n}</span>
      <p className="pt-1 text-[15px] leading-relaxed">{children}{Icon && <Icon size={16} className="inline ml-1.5 -mt-0.5 text-primary" aria-hidden="true" />}</p>
    </li>
  )

  return (
    <div>
      <div role="tablist" className="inline-flex p-1 rounded-xl bg-raised border border-line mb-5">
        {[['ios', 'iPhone / iPad'], ['android', 'Android']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`h-9 px-4 rounded-lg font-semibold cursor-pointer ${tab === k ? 'bg-primary text-bg' : 'text-muted hover:text-ink'}`}>{l}</button>
        ))}
      </div>

      {tab === 'ios' ? (
        <>
          {isIOS && !isIOSSafari && (
            <p className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-sm">Sur iPhone, l’installation se fait uniquement depuis <span className="font-semibold">Safari</span>. Copie l’adresse de cette page et ouvre-la dans Safari.</p>
          )}
          <ol className="space-y-4">
            <Step n={1}>Ouvre FORGE dans <span className="font-semibold">Safari</span>.</Step>
            <Step n={2} icon={Share}>Touche le bouton <span className="font-semibold">Partager</span> en bas de l’écran (le carré avec une flèche vers le haut).</Step>
            <Step n={3} icon={SquarePlus}>Fais défiler et choisis <span className="font-semibold">« Sur l’écran d’accueil »</span>.</Step>
            <Step n={4}>Vérifie que l’option <span className="font-semibold">« Ouvrir en tant qu’app web »</span> est activée si elle apparaît, puis touche <span className="font-semibold">Ajouter</span>.</Step>
            <Step n={5}>Lance FORGE depuis l’icône orange : elle s’ouvre en plein écran et fonctionne hors ligne.</Step>
          </ol>
        </>
      ) : (
        <>
          {canPrompt && (
            <button className="btn-primary btn-lg w-full mb-5" onClick={prompt}><Download size={18} aria-hidden="true" />Installer FORGE maintenant</button>
          )}
          <ol className="space-y-4">
            <Step n={1}>Ouvre FORGE dans <span className="font-semibold">Chrome</span> (ou Samsung Internet).</Step>
            <Step n={2} icon={MoreVertical}>Touche le menu <span className="font-semibold">⋮</span> en haut à droite.</Step>
            <Step n={3}>Choisis <span className="font-semibold">« Installer l’application »</span> (ou « Ajouter à l’écran d’accueil »), puis confirme.</Step>
            <Step n={4}>FORGE apparaît dans tes applications et sur l’écran d’accueil, comme une app classique.</Step>
          </ol>
          {isAndroid && !canPrompt && <p className="text-sm text-muted mt-4">Le bouton d’installation direct apparaît après quelques secondes de navigation sur le site.</p>}
        </>
      )}

      <div className="mt-6 p-4 rounded-xl bg-raised/60 text-sm text-muted space-y-1.5">
        <p className="flex gap-2"><ShieldCheck size={16} className="text-success shrink-0 mt-0.5" aria-hidden="true" />Tes données restent <span className="text-ink font-medium">uniquement sur ton téléphone</span>. Rien n’est envoyé sur internet.</p>
        <p className="flex gap-2"><WifiOff size={16} className="text-success shrink-0 mt-0.5" aria-hidden="true" />Une fois installée, l’app fonctionne <span className="text-ink font-medium">sans connexion</span>, même au sous-sol de ta salle.</p>
        <p className="flex gap-2"><Download size={16} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />Supprimer l’app supprime aussi ses données : fais une sauvegarde de temps en temps (Profil → Exporter).</p>
      </div>
    </div>
  )
}
