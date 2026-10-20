import { useState } from 'react'
import { CloudUpload, Share, FolderOpen, Replace, CheckCircle2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { exportBackup, backupFileName, isIOS } from '../lib/pwa'
import { Modal } from './ui'

/**
 * The one backup button used everywhere. First use shows a 3-step guide;
 * afterwards it opens the share sheet directly. onDone(result) after a successful save.
 */
export default function BackupButton({ className = 'btn-primary btn-md', label, onDone, icon = true }) {
  const { settings, updateSettings } = useStore()
  const [help, setHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  const file = backupFileName()

  const run = async () => {
    setBusy(true)
    const r = await exportBackup()
    setBusy(false)
    if (r.done) onDone?.(r)
  }
  const click = () => (settings.backupHelpSeen ? run() : setHelp(true))

  return (
    <>
      <button type="button" className={className} onClick={click} disabled={busy}>
        {icon && <CloudUpload size={17} aria-hidden="true" />}{label || (isIOS ? 'Sauvegarder dans iCloud' : 'Sauvegarder')}
      </button>
      <Modal open={help} onClose={() => setHelp(false)} title="Ta sauvegarde en 3 gestes" size="sm"
        footer={<button className="btn-primary btn-md w-full" onClick={() => { updateSettings({ backupHelpSeen: true }); setHelp(false); run() }}><CloudUpload size={17} aria-hidden="true" />Compris, sauvegarder</button>}>
        <p className="text-muted text-sm mb-4">
          Toutes tes données vont dans <span className="text-ink font-semibold">un seul fichier</span>, <span className="text-ink font-mono text-[13px]">{file}</span>, que tu remplaces à chaque fois. Il contient toujours tout depuis le début.
        </p>
        <ol className="space-y-3">
          {[
            [Share, <>Dans le menu qui s’ouvre, touche <b>« Enregistrer dans Fichiers »</b>.</>],
            [FolderOpen, <>La première fois, choisis <b>iCloud Drive</b> (crée un dossier « FORGE » si tu veux). Les fois suivantes, l’iPhone propose directement ce dossier.</>],
            [Replace, <>Touche <b>Enregistrer</b>, puis <b>Remplacer</b> si l’iPhone demande : ton fichier est mis à jour.</>],
          ].map(([Icon, text], i) => (
            <li key={i} className="flex gap-3">
              <span className="grid place-items-center size-8 rounded-full bg-primary/15 text-primary shrink-0"><Icon size={16} aria-hidden="true" /></span>
              <p className="text-[15px] pt-1">{text}</p>
            </li>
          ))}
        </ol>
        <p className="flex gap-2 text-sm text-muted mt-4"><CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" aria-hidden="true" />Chaque nouvelle année, un nouveau fichier est créé (il contient tout) : tu pourras supprimer celui de l’année d’avant.</p>
      </Modal>
    </>
  )
}
