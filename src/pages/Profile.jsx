import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footprints, Medal, Trophy, Weight, Truck, Zap, Flame, Sunrise, Timer, Lock, Download, Upload, Sparkles, RotateCcw, Settings, User, Check, LogOut } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader, Card, CardHeader, Field, Modal, Toggle, ProgressRing } from '../components/ui'
import { BADGES, badgeStats, xpInfo, fmt, ACTIVITY, relDay } from '../lib/calc'
import { InstallGuide } from '../components/AppBanners'
import StoragePanel from '../components/StoragePanel'

const ICONS = { Footprints, Medal, Trophy, Weight, Truck, Zap, Flame, Sunrise, Timer }
const GOALS = { lose: 'Perdre du gras', muscle: 'Prendre du muscle', strength: 'Gagner en force', maintain: 'Rester en forme' }

export default function Profile() {
  const s = useStore()
  const { profile, workouts, settings } = s
  const [f, setF] = useState(profile)
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()
  const xp = xpInfo(workouts)
  const st = badgeStats(workouts, profile.weeklyTarget)
  const unlocked = BADGES.filter((b) => b.test(st)).length

  const set = (k, num) => (e) => { setSaved(false); setF({ ...f, [k]: num ? +e.target.value : e.target.value }) }
  const save = (e) => {
    e.preventDefault()
    s.setProfile({ ...f, name: f.name.trim() || profile.name })
    setSaved(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Compte" title="Profil"
        actions={<button className="btn-ghost btn-md" onClick={() => { navigate('/', { replace: true }); s.logout() }}><LogOut size={17} aria-hidden="true" />Se déconnecter</button>} />

      <div className="grid xl:grid-cols-[1fr_1.3fr] gap-4 items-start">
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_100%_0%,rgb(var(--warning)/0.15),transparent)]" aria-hidden="true" />
          <div className="relative flex items-center gap-5">
            <ProgressRing value={xp.progress} size={110} stroke={8} color="rgb(var(--warning))" label={`Niveau ${xp.level}, ${Math.round(xp.progress * 100)} % vers le suivant`}>
              <span className="grid place-items-center size-20 rounded-full bg-gradient-to-br from-primary to-warning text-bg font-display text-4xl font-extrabold">{profile.name[0]?.toUpperCase()}</span>
            </ProgressRing>
            <div className="min-w-0">
              <h2 className="text-4xl font-extrabold uppercase leading-none truncate">{profile.name}</h2>
              <p className="text-warning font-semibold mt-1 flex items-center gap-1.5"><Sparkles size={16} aria-hidden="true" />Niveau {xp.level} · {xp.title}</p>
              <p className="text-sm text-muted mt-1 tabular">{fmt(xp.xp)} XP · encore {fmt(xp.toNext)} XP</p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-2 mt-6 text-center">
            {[[workouts.length, 'séances'], [st.prs, 'records'], [fmt(st.kcal), 'kcal brûlées']].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-raised/70 p-3"><div className="font-display text-2xl font-bold tabular">{v}</div><div className="text-xs text-muted">{l}</div></div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader icon={Trophy} title="Badges" subtitle={`${unlocked} / ${BADGES.length} débloqués`} />
          <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {BADGES.map((b) => {
              const ok = b.test(st)
              const Icon = ICONS[b.icon] || Medal
              return (
                <li key={b.id} className={`rounded-xl p-3 text-center border ${ok ? 'border-warning/40 bg-warning/10' : 'border-line bg-raised/40'}`} title={b.desc}>
                  <span className={`mx-auto grid place-items-center size-11 rounded-full ${ok ? 'bg-warning text-bg' : 'bg-line text-faint'}`}>
                    {ok ? <Icon size={20} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                  </span>
                  <div className={`text-sm font-semibold mt-2 leading-tight ${ok ? '' : 'text-muted'}`}>{b.name}</div>
                  <div className="text-[11px] text-muted mt-0.5 leading-tight">{b.desc}</div>
                  <span className="sr-only">{ok ? 'Débloqué' : 'Verrouillé'}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-4 items-start">
        <Card className="p-5 sm:p-6">
          <CardHeader icon={User} title="Informations" subtitle="Elles servent au calcul des calories et des recommandations" />
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            <Field label="Prénom" id="p-name"><input id="p-name" className="input" value={f.name} onChange={set('name')} /></Field>
            <Field label="Sexe" id="p-sex">
              <select id="p-sex" className="input" value={f.sex} onChange={set('sex')}><option value="m">Homme</option><option value="f">Femme</option></select>
            </Field>
            <Field label="Âge" id="p-age"><input id="p-age" type="number" className="input" value={f.age} onChange={set('age', true)} /></Field>
            <Field label="Taille (cm)" id="p-h"><input id="p-h" type="number" className="input" value={f.height} onChange={set('height', true)} /></Field>
            <Field label="Poids actuel (kg)" id="p-w"><input id="p-w" type="number" step="0.1" className="input" value={f.weight} onChange={set('weight', true)} /></Field>
            <Field label="Poids visé (kg)" id="p-tw"><input id="p-tw" type="number" step="0.1" className="input" value={f.targetWeight} onChange={set('targetWeight', true)} /></Field>
            <Field label="Objectif" id="p-goal">
              <select id="p-goal" className="input" value={f.goal} onChange={set('goal')}>{Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Field>
            <Field label="Activité hors salle" id="p-act">
              <select id="p-act" className="input" value={f.activity} onChange={set('activity', true)}>{ACTIVITY.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}</select>
            </Field>
            <Field label={`Séances par semaine : ${f.weeklyTarget}`} id="p-wt">
              <input id="p-wt" type="range" min="1" max="7" value={f.weeklyTarget} onChange={set('weeklyTarget', true)} className="w-full accent-[rgb(var(--primary))] h-11" />
            </Field>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button className="btn-primary btn-md">Enregistrer</button>
              {saved && <span className="text-success text-sm flex items-center gap-1.5" role="status"><Check size={16} aria-hidden="true" />Profil mis à jour</span>}
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <CardHeader icon={Settings} title="Préférences" />
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div><div className="font-semibold">Signal sonore</div><div className="text-sm text-muted">Bip et vibration à la fin du repos</div></div>
                <Toggle checked={settings.sound} onChange={(v) => s.updateSettings({ sound: v })} label="Signal sonore" />
              </div>
              <div>
                <label htmlFor="rest" className="font-semibold block">Repos par défaut : <span className="text-primary">{settings.rest} s</span></label>
                <p className="text-sm text-muted">Utilisé quand un exercice n’a pas de repos défini</p>
                <input id="rest" type="range" min="30" max="300" step="15" value={settings.rest} onChange={(e) => s.updateSettings({ rest: +e.target.value })} className="w-full mt-2 accent-[rgb(var(--primary))]" />
              </div>
            </div>
          </Card>

        </div>
      </div>

      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-4 items-start">
        <StoragePanel />
        <Card className="p-5 sm:p-6">
          <CardHeader icon={Settings} title="Application" subtitle="Installation sur ton téléphone et fonctionnement hors ligne" />
          <InstallGuide />
        </Card>
      </div>
    </div>
  )
}
