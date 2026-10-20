import { useState } from 'react'
import { ArrowRight, ArrowLeft, Sparkles, Flame, Dumbbell, Scale, Trophy, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { Logo } from '../components/Layout'
import { Field } from '../components/ui'
import RestoreBackup from '../components/RestoreBackup'
import { ACTIVITY, bmr } from '../lib/calc'

const GOALS = [
  { v: 'lose', label: 'Perdre du gras', icon: Flame, hint: 'Déficit calorique, cardio et circuits' },
  { v: 'muscle', label: 'Prendre du muscle', icon: Dumbbell, hint: 'Hypertrophie et volume progressif' },
  { v: 'strength', label: 'Gagner en force', icon: Trophy, hint: 'Charges lourdes et records' },
  { v: 'maintain', label: 'Rester en forme', icon: Scale, hint: 'Santé, énergie, régularité' },
]

export default function Onboarding({ onBack, onDone }) {
  const { setProfile, loadDemo } = useStore()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [f, setF] = useState({
    name: '', sex: 'm', age: 28, height: 175, weight: 75, targetWeight: 72,
    goal: 'lose', level: 1, weeklyTarget: 3, activity: 1.375,
  })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }))

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!f.name.trim()) e.name = 'Indique ton prénom pour personnaliser ton espace.'
      if (!(+f.age >= 13 && +f.age <= 99)) e.age = 'Âge entre 13 et 99 ans.'
    }
    if (step === 1) {
      if (!(+f.height >= 120 && +f.height <= 230)) e.height = 'Taille entre 120 et 230 cm.'
      if (!(+f.weight >= 35 && +f.weight <= 250)) e.weight = 'Poids entre 35 et 250 kg.'
      if (!(+f.targetWeight >= 35 && +f.targetWeight <= 250)) e.targetWeight = 'Objectif entre 35 et 250 kg.'
    }
    setErrors(e)
    return !Object.keys(e).length
  }
  const next = () => {
    if (!validate()) return
    if (step < 2) return setStep(step + 1)
    onDone?.()
    setProfile({
      ...f, name: f.name.trim(), age: +f.age, height: +f.height, weight: +f.weight, targetWeight: +f.targetWeight,
      weeklyTarget: +f.weeklyTarget, intake: Math.round(bmr({ ...f, weight: +f.weight, height: +f.height, age: +f.age }) * f.activity - (f.goal === 'lose' ? 400 : f.goal === 'muscle' ? -250 : 0)),
    })
  }

  const steps = ['Toi', 'Mensurations', 'Objectif']

  return (
    <div className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr]">
      {/* Visual side */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 border-r border-line">
        <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_20%_20%,rgb(var(--primary)/0.25),transparent_70%),radial-gradient(500px_400px_at_80%_90%,rgb(var(--success)/0.12),transparent_70%)]" />
        <div className="absolute -right-24 top-1/3 font-display font-extrabold text-[260px] leading-none text-ink/[0.03] select-none" aria-hidden="true">FORGE</div>
        <div className="relative"><Logo /></div>
        <div className="relative max-w-lg">
          <p className="eyebrow text-primary mb-3">Ton coach de poche</p>
          <h1 className="text-7xl font-extrabold uppercase leading-[0.9]">Forge le corps<br />que tu mérites.</h1>
          <p className="text-muted text-lg mt-5">Plus de 70 exercices expliqués, des programmes testés, le suivi de chaque série, tes records, tes calories et ta progression, au même endroit.</p>
          <ul className="mt-8 grid grid-cols-2 gap-3">
            {['Suivi série par série', 'Minuteur de repos', 'Records détectés auto.', 'Estimation des calories', 'Carte de récupération', 'Projection de poids'].map((t) => (
              <li key={t} className="flex items-center gap-2 text-[15px]"><span className="grid place-items-center size-5 rounded-full bg-success/20 text-success"><Check size={13} strokeWidth={3} aria-hidden="true" /></span>{t}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-faint">Tes données restent sur ton appareil.</p>
      </div>

      {/* Form side */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="lg:hidden mb-8"><Logo /></div>
        <div className="w-full max-w-md mx-auto">
          {onBack && (
            <button type="button" onClick={onBack} className="btn-ghost btn-sm mb-6"><ArrowLeft size={16} aria-hidden="true" />Choisir un profil existant</button>
          )}
          <ol className="flex items-center gap-2 mb-8" aria-label="Étapes">
            {steps.map((s, i) => (
              <li key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition ${i <= step ? 'bg-primary' : 'bg-raised'}`} />
                <span className={`block mt-2 text-xs font-semibold uppercase tracking-wider ${i === step ? 'text-ink' : 'text-faint'}`}>{i + 1}. {s}</span>
              </li>
            ))}
          </ol>

          <form onSubmit={(e) => { e.preventDefault(); next() }} noValidate key={step} className="animate-fade-up">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-4xl font-bold uppercase">Bienvenue</h2>
                  <p className="text-muted mt-1">Quelques infos pour calibrer tes calories et tes recommandations.</p>
                </div>
                <Field label="Prénom" id="name">
                  <input id="name" className="input" value={f.name} onChange={set('name')} autoComplete="given-name" autoFocus aria-invalid={!!errors.name} aria-describedby="name-err" />
                  {errors.name && <p id="name-err" className="text-sm text-danger mt-1.5">{errors.name}</p>}
                </Field>
                <div>
                  <span className="label">Sexe (pour le métabolisme de base)</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[['m', 'Homme'], ['f', 'Femme']].map(([v, l]) => (
                      <button type="button" key={v} onClick={() => set('sex')(v)} aria-pressed={f.sex === v}
                        className={`h-11 rounded-xl border font-semibold transition cursor-pointer ${f.sex === v ? 'border-primary bg-primary/12 text-primary' : 'border-line bg-raised text-muted hover:text-ink'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <Field label="Âge" id="age">
                  <input id="age" type="number" inputMode="numeric" className="input" value={f.age} onChange={set('age')} aria-invalid={!!errors.age} />
                  {errors.age && <p className="text-sm text-danger mt-1.5">{errors.age}</p>}
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-4xl font-bold uppercase">Tes mesures</h2>
                  <p className="text-muted mt-1">On s’en sert pour estimer ta dépense et suivre ton évolution.</p>
                </div>
                {[['height', 'Taille', 'cm'], ['weight', 'Poids actuel', 'kg'], ['targetWeight', 'Poids visé', 'kg']].map(([k, l, u]) => (
                  <Field key={k} label={l} id={k}>
                    <div className="relative">
                      <input id={k} type="number" inputMode="decimal" step="0.1" className="input pr-12" value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} autoFocus={k === 'height'} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">{u}</span>
                    </div>
                    {errors[k] && <p className="text-sm text-danger mt-1.5">{errors[k]}</p>}
                  </Field>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-4xl font-bold uppercase">Ton objectif</h2>
                  <p className="text-muted mt-1">Tu pourras le modifier à tout moment.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => {
                    const Icon = g.icon
                    const on = f.goal === g.v
                    return (
                      <button type="button" key={g.v} onClick={() => set('goal')(g.v)} aria-pressed={on}
                        className={`text-left p-3 rounded-xl border transition cursor-pointer ${on ? 'border-primary bg-primary/10' : 'border-line bg-raised/60 hover:border-faint'}`}>
                        <Icon size={20} className={on ? 'text-primary' : 'text-muted'} aria-hidden="true" />
                        <span className="block font-semibold mt-2">{g.label}</span>
                        <span className="block text-xs text-muted mt-0.5">{g.hint}</span>
                      </button>
                    )
                  })}
                </div>
                <Field label="Activité hors salle" id="activity">
                  <select id="activity" className="input" value={f.activity} onChange={(e) => set('activity')(+e.target.value)}>
                    {ACTIVITY.map((a) => <option key={a.v} value={a.v}>{a.label} — {a.hint}</option>)}
                  </select>
                </Field>
                <div>
                  <span className="label">Séances par semaine visées : <span className="text-ink font-semibold">{f.weeklyTarget}</span></span>
                  <input type="range" min="1" max="7" value={f.weeklyTarget} onChange={set('weeklyTarget')} className="w-full accent-[rgb(var(--primary))]" aria-label="Séances par semaine" />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-8">
              {step > 0 && (
                <button type="button" className="btn-ghost btn-lg" onClick={() => setStep(step - 1)} aria-label="Étape précédente"><ArrowLeft size={18} /></button>
              )}
              <button type="submit" className="btn-primary btn-lg flex-1">
                {step < 2 ? 'Continuer' : 'Créer mon espace'} <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-line text-center">
            <p className="text-sm text-muted mb-3">Nouveau téléphone ? Envie de voir l’app en action d’abord ?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <RestoreBackup onDone={onDone} />
              <button className="btn-outline btn-md" onClick={() => { onDone?.(); loadDemo() }}>
                <Sparkles size={17} className="text-primary" aria-hidden="true" /> Explorer la démo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
