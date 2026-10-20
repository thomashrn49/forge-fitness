import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, ShieldCheck, ShieldAlert, Download, Upload, History, CheckCircle2, AlertTriangle, Sparkles, RotateCcw, CloudUpload } from 'lucide-react'
import { useStore, STORE_KEY } from '../lib/store'
import { Card, CardHeader, Modal, Toggle } from './ui'
import { parseBackup, isIOS, yearChange, backupFileName } from '../lib/pwa'
import BackupButton from './BackupButton'
import { storageHealth, storageStatus, listSnapshots, restoreSnapshot, flushStorage, snapshotNow } from '../lib/storage'
import { fmt, fmtDate, relDay } from '../lib/calc'

const fmtSize = (b) => (b == null ? '—' : b < 1024 * 1024 ? `${fmt(b / 1024)} Ko` : `${fmt(b / 1024 / 1024, 1)} Mo`)
const FREQ = [[3, 'Tous les 3 jours'], [7, 'Chaque semaine'], [14, 'Toutes les 2 semaines'], [30, 'Chaque mois'], [0, 'Jamais']]

export default function StoragePanel() {
  const s = useStore()
  const { settings, updateSettings, workouts, bodyLog, accounts, currentId, profile } = s
  const navigate = useNavigate()
  const [health, setHealth] = useState(null)
  const [snaps, setSnaps] = useState([])
  const [pendingImport, setPendingImport] = useState(null)
  const [confirmSnap, setConfirmSnap] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [msg, setMsg] = useState(null)
  const fileRef = useRef(null)

  const refresh = async () => {
    await flushStorage()
    setHealth(await storageHealth())
    setSnaps(await listSnapshots(STORE_KEY))
  }
  useEffect(() => { refresh() }, [workouts.length, bodyLog.length])

  const otherProfiles = Object.entries(accounts || {}).filter(([id, a]) => a.profile && id !== currentId)
  const totalWorkouts = workouts.length + otherProfiles.reduce((t, [, a]) => t + (a.workouts?.length || 0), 0)
  const lastBackup = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null
  const backupDays = lastBackup ? Math.floor((Date.now() - lastBackup.getTime()) / 86400000) : null
  const backupOk = lastBackup && (settings.backupEvery === 0 || backupDays <= (settings.backupEvery || 7))
  const ok = !storageStatus.lastError

  const year = yearChange(settings)
  const onSaved = (r) => setMsg({ ok: true, text: r.previousFile
    ? `Sauvegarde ${new Date().getFullYear()} créée : elle contient tout. Tu peux supprimer ${r.previousFile} de iCloud Drive.`
    : `Fichier ${r.name} mis à jour.` })
  const onFile = async (file) => {
    if (!file) return
    const r = await parseBackup(file)
    if (!r.ok) setMsg({ ok: false, text: r.error })
    else setPendingImport(r)
    if (fileRef.current) fileRef.current.value = ''
  }
  const applyImport = async (mode) => {
    await snapshotNow(STORE_KEY, 'import')
    if (mode === 'merge') s.mergeBackup(pendingImport)
    else if (pendingImport.kind === 'all') s.restoreAll(pendingImport.payload)
    else s.importData(pendingImport.payload)
    setPendingImport(null)
    setMsg({ ok: true, text: mode === 'merge' ? 'Sauvegarde fusionnée : les séances manquantes ont été ajoutées.' : 'Sauvegarde restaurée.' })
    navigate('/', { replace: true })
  }

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader icon={Database} title="Stockage & sauvegardes" subtitle="Tes données sont enregistrées uniquement sur ce téléphone" />

      {/* Health */}
      <div className="grid sm:grid-cols-2 gap-2">
        <Status ok={ok} title={ok ? 'Base de données en bon état' : 'Problème d’enregistrement'}
          text={ok ? `Enregistrement automatique à chaque action${storageStatus.lastWriteAt ? ` · dernier : ${new Date(storageStatus.lastWriteAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}` : storageStatus.lastError} />
        <Status ok={health?.persisted !== false} warn={health?.persisted == null}
          title={health?.persisted ? 'Protégé contre l’effacement' : health?.persisted === false ? 'Protection non accordée' : 'Protection : inconnue'}
          text={health?.persisted ? 'Le téléphone s’est engagé à ne pas effacer ces données.' : 'Installe l’app sur l’écran d’accueil pour la meilleure protection, et sauvegarde régulièrement.'} />
        <Status ok={!!backupOk} warn={!lastBackup}
          title={lastBackup ? `Dernière sauvegarde : ${relDay(lastBackup).toLowerCase()}` : 'Aucune sauvegarde'}
          text={lastBackup ? fmtDate(lastBackup, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fais ta première sauvegarde dans iCloud Drive.'} />
        <div className="p-3 rounded-xl bg-raised/60">
          <div className="text-sm font-semibold">Contenu</div>
          <div className="text-sm text-muted mt-0.5">
            {otherProfiles.length + (profile ? 1 : 0)} profil{otherProfiles.length ? 's' : ''} · {fmt(totalWorkouts)} séances · {bodyLog.length} pesées · {fmtSize(health?.usage)} utilisés
          </div>
        </div>
      </div>

      {storageStatus.recoveredFrom && (
        <p className="mt-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-sm">
          Au dernier démarrage, les données principales étaient illisibles : FORGE les a restaurées automatiquement depuis sa copie de secours {storageStatus.recoveredFrom === 'safe' ? 'récente' : 'du jour'}.
        </p>
      )}

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-2 mt-4">
        <BackupButton onDone={onSaved} />
        <button className="btn-ghost btn-md" onClick={() => fileRef.current?.click()}><Upload size={17} aria-hidden="true" />Restaurer une sauvegarde</button>
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {msg && <p className={`text-sm mt-3 flex gap-2 ${msg.ok ? 'text-success' : 'text-danger'}`} role="status">{msg.ok ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}{msg.text}</p>}
      <p className="text-xs text-muted mt-2">Un seul fichier, <span className="text-ink font-mono">{backupFileName()}</span>, remplacé à chaque sauvegarde : il contient <span className="text-ink">tout</span> (tous les profils, depuis le début). Un nouveau fichier est créé chaque année.</p>
      {year && (
        <p className="mt-3 p-3 rounded-xl bg-info/10 border border-info/30 text-sm">Nouvelle année : ta prochaine sauvegarde créera <span className="font-mono">{year.newFile}</span>. Ensuite, tu pourras supprimer <span className="font-mono">{year.oldFile}</span> de iCloud Drive.</p>
      )}

      {/* Settings */}
      <div className="mt-5 pt-5 border-t border-line space-y-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="bk-freq" className="min-w-0"><span className="font-semibold block">Rappel de sauvegarde</span><span className="text-sm text-muted">Un rappel apparaît sur le tableau de bord</span></label>
          <select id="bk-freq" className="input w-auto" value={settings.backupEvery ?? 7} onChange={(e) => updateSettings({ backupEvery: +e.target.value, backupSnoozedUntil: null })}>
            {FREQ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0"><div className="font-semibold">Proposer après chaque séance</div><div className="text-sm text-muted">Bouton de sauvegarde sur l’écran de bilan</div></div>
          <Toggle checked={settings.backupAfterWorkout !== false} onChange={(v) => updateSettings({ backupAfterWorkout: v })} label="Proposer une sauvegarde après chaque séance" />
        </div>
      </div>

      {/* Internal copies */}
      <div className="mt-5 pt-5 border-t border-line">
        <div className="font-semibold flex items-center gap-2"><History size={16} className="text-primary" aria-hidden="true" />Copies de secours automatiques</div>
        <p className="text-sm text-muted mt-0.5 mb-3">FORGE garde dans le téléphone une copie récente, une copie avant chaque action risquée et une copie par jour (5 derniers jours). Utile après une fausse manipulation.</p>
        {snaps.length ? (
          <ul className="space-y-1.5">
            {snaps.map((sn) => (
              <li key={sn.key} className="flex items-center gap-3 p-2.5 rounded-xl bg-raised/50">
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-medium">{sn.kind === 'safe' ? 'Copie récente (moins de 5 min)'
                    : sn.kind === 'before' ? `${sn.label} · ${fmtDate(sn.date, { day: 'numeric', month: 'short' })} ${new Date(sn.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                      : `Début de journée · ${fmtDate(sn.date + 'T12:00', { weekday: 'short', day: 'numeric', month: 'short' })}`}</div>
                  <div className="text-muted truncate">{sn.profiles.join(', ') || 'aucun profil'} · {sn.workouts} séances</div>
                </div>
                <button className="btn-ghost btn-sm" onClick={() => setConfirmSnap(sn)}><RotateCcw size={14} aria-hidden="true" />Restaurer</button>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Les copies apparaîtront après tes premières modifications.</p>}
      </div>

      {/* Danger zone */}
      <div className="grid sm:grid-cols-2 gap-2 mt-5 pt-5 border-t border-line">
        <button className="btn-outline btn-md" onClick={() => setConfirm('demo')}><Sparkles size={17} className="text-primary" aria-hidden="true" />Données de démo</button>
        <button className="btn-danger btn-md" onClick={() => setConfirm('reset')}><RotateCcw size={17} aria-hidden="true" />Supprimer ce profil</button>
      </div>

      <Modal open={!!pendingImport} onClose={() => setPendingImport(null)} title="Restaurer cette sauvegarde ?" size="sm"
        footer={<>
          <button className="btn-ghost btn-md" onClick={() => applyImport('replace')}>Tout remplacer</button>
          <button className="btn-primary btn-md" onClick={() => applyImport('merge')}><Upload size={17} aria-hidden="true" />Fusionner</button>
        </>}>
        {pendingImport && (
          <div className="space-y-3">
            <p className="text-muted text-sm">Sauvegarde du {pendingImport.exportedAt ? fmtDate(pendingImport.exportedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}. Le fichier est valide et contient :</p>
            <ul className="space-y-1.5">
              {pendingImport.summary.map((p, i) => (
                <li key={i} className="flex justify-between gap-3 p-2.5 rounded-xl bg-raised/60 text-sm">
                  <span className="font-semibold truncate">{p.name}</span><span className="text-muted shrink-0">{p.workouts} séances · {p.bodyLog} pesées</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              <span className="text-ink font-semibold">Fusionner (conseillé)</span> : ajoute ce qui manque sans rien effacer. <span className="text-ink font-semibold">Tout remplacer</span> : revient exactement au contenu du fichier. Dans les deux cas, l’état actuel est d’abord copié dans « Copies de secours ».
            </p>
          </div>
        )}
      </Modal>

      <Modal open={!!confirmSnap} onClose={() => setConfirmSnap(null)} title="Revenir à cette copie ?" size="sm"
        footer={<><button className="btn-ghost btn-md" onClick={() => setConfirmSnap(null)}>Annuler</button><button className="btn-primary btn-md" onClick={() => restoreSnapshot(STORE_KEY, confirmSnap.key)}>Restaurer et redémarrer</button></>}>
        <p className="text-muted">Toutes les données de ce téléphone reviendront à l’état de cette copie ({confirmSnap?.workouts} séances). Ce que tu as fait depuis sera perdu. Pense à sauvegarder d’abord si tu as un doute.</p>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'reset' ? 'Supprimer ce profil ?' : 'Charger la démo ?'} size="sm"
        footer={<>
          <button className="btn-ghost btn-md" onClick={() => setConfirm(null)}>Annuler</button>
          <button className={confirm === 'reset' ? 'btn-danger btn-md' : 'btn-primary btn-md'} onClick={async () => {
            await snapshotNow(STORE_KEY, confirm === 'reset' ? 'reset' : 'demo')
            if (confirm === 'reset') { navigate('/', { replace: true }); s.resetAll() } else s.loadDemo(profile)
            setConfirm(null)
          }}>{confirm === 'reset' ? 'Supprimer définitivement' : 'Remplacer mes données'}</button>
        </>}>
        <p className="text-muted">
          {confirm === 'reset' ? 'Ce profil, ses séances, pesées et modèles seront supprimés. Les autres profils ne sont pas touchés. Une copie est d’abord gardée dans « Copies de secours » au cas où.'
            : 'Tes séances et pesées actuelles seront remplacées par 10 semaines de données d’exemple.'}
        </p>
      </Modal>
    </Card>
  )
}

function Status({ ok, warn, title, text }) {
  const Icon = ok && !warn ? ShieldCheck : warn ? ShieldAlert : AlertTriangle
  const tone = ok && !warn ? 'text-success' : warn ? 'text-warning' : 'text-danger'
  return (
    <div className="p-3 rounded-xl bg-raised/60 flex gap-2.5">
      <Icon size={18} className={`${tone} shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-sm text-muted">{text}</div>
      </div>
    </div>
  )
}
