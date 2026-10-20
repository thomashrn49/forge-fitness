import { useRef, useState } from 'react'
import { Upload, AlertTriangle } from 'lucide-react'
import { useStore, STORE_KEY } from '../lib/store'
import { parseBackup } from '../lib/pwa'
import { snapshotNow } from '../lib/storage'
import { Modal } from './ui'
import { fmtDate } from '../lib/calc'

/** "I have a backup" button for first launch / profile list: pick the file, check it, confirm, restore. */
export default function RestoreBackup({ className = 'btn-outline btn-md', label = 'J’ai une sauvegarde', onDone }) {
  const { mergeBackup } = useStore()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  const onFile = async (file) => {
    if (!file) return
    setError(null)
    const r = await parseBackup(file)
    if (r.ok) setPending(r)
    else setError(r.error)
    if (fileRef.current) fileRef.current.value = ''
  }
  const apply = async () => {
    await snapshotNow(STORE_KEY, 'import')
    mergeBackup(pending)
    setPending(null)
    onDone?.()
  }

  return (
    <>
      <button type="button" className={className} onClick={() => fileRef.current?.click()}><Upload size={17} aria-hidden="true" />{label}</button>
      <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={(e) => onFile(e.target.files?.[0])} aria-label="Choisir un fichier de sauvegarde" />
      {error && <p className="text-sm text-danger mt-2 flex gap-1.5 justify-center" role="alert"><AlertTriangle size={15} className="shrink-0 mt-0.5" />{error}</p>}
      <Modal open={!!pending} onClose={() => setPending(null)} title="Restaurer cette sauvegarde ?" size="sm"
        footer={<><button className="btn-ghost btn-md" onClick={() => setPending(null)}>Annuler</button><button className="btn-primary btn-md" onClick={apply}><Upload size={17} aria-hidden="true" />Restaurer</button></>}>
        {pending && (
          <div className="space-y-3">
            <p className="text-muted text-sm">Sauvegarde du {pending.exportedAt ? fmtDate(pending.exportedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}. Le fichier est valide et contient :</p>
            <ul className="space-y-1.5">
              {pending.summary.map((p, i) => (
                <li key={i} className="flex justify-between gap-3 p-2.5 rounded-xl bg-raised/60 text-sm">
                  <span className="font-semibold truncate">{p.name}</span><span className="text-muted shrink-0">{p.workouts} séances · {p.bodyLog} pesées</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  )
}
