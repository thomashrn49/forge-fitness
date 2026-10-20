// Smart French exercise search.
// Pipeline (identical for documents and queries): normalise → multi-word phrases → tokens → stop words → light stemming.
// Queries are then expanded with synonyms (gym slang, English, body parts) and matched with prefix + typo tolerance.
import { EXERCISES, MUSCLES, LEVELS } from '../data/exercises'

// ── Normalisation ──────────────────────────────────────────────────────────
export const normalize = (s) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[’'`]/g, ' ').replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, ' ').trim()

// multi-word expressions collapsed into a single canonical token (applied to docs AND queries)
const PHRASES = [
  ['poids du corps', 'pdc'], ['sans materiel', 'pdc'], ['sans equipement', 'pdc'], ['a la maison', 'pdc'], ['body weight', 'pdc'],
  ['street workout', 'pdc'], ['avant bras', 'avantbras'], ['ischio jambiers', 'ischio'], ['ischios jambiers', 'ischio'],
  ['bas du dos', 'lombaires'], ['lower back', 'lombaires'], ['haut du dos', 'trapezes'], ['grand dorsal', 'dos'],
  ['perte de poids', 'brulegraisse'], ['perdre du poids', 'brulegraisse'], ['bruler des calories', 'brulegraisse'], ['bruler les graisses', 'brulegraisse'],
  ['perdre du ventre', 'brulegraisse abdominaux'], ['fat burn', 'brulegraisse'],
  ['haut du corps', 'hautcorps'], ['bas du corps', 'bascorps'], ['full body', 'fullbody'], ['corps entier', 'fullbody'],
  ['interieur des cuisses', 'adducteurs'], ['interieur cuisse', 'adducteurs'], ['exterieur cuisse', 'abducteurs'], ['arriere cuisse', 'ischio'],
  ['arriere d epaule', 'epauleArriere'], ['arriere epaule', 'epauleArriere'], ['poignees d amour', 'obliques'],
  ['smith machine', 'smith'], ['vis a vis', 'visavis'], ['t bar', 'tbar'], ['bench press', 'benchpress'],
]

const STOP = new Set(('de du des la le les l d un une au aux a avec en pour sur et ou par mon ma mes ton ta tes '
  + 'exercice exercices exo exos travailler travail muscler renforcer renforcement faire je veux comment quel quels quelle '
  + 'bon bons meilleur meilleurs pour the of with').split(' '))

const stem = (t) => {
  if (t.length > 4 && t.endsWith('aux')) return t.slice(0, -3) + 'al' // pectoraux → pectoral, dorsaux → dorsal
  if (t.length > 3 && (t.endsWith('s') || t.endsWith('x'))) return t.slice(0, -1)
  return t
}

export function tokenize(text) {
  let s = ` ${normalize(text)} `
  for (const [a, b] of PHRASES) s = s.split(` ${a} `).join(` ${b.toLowerCase()} `)
  return s.split(' ').filter((t) => t && !STOP.has(t)).map(stem)
}

// ── Synonyms (query side). Values are canonical tokens found in the index. ──────
const SYN_RAW = {
  pectoral: ['pec', 'pecs', 'pectoraux', 'poitrine', 'torse', 'chest', 'pecto', 'buste'],
  abdominal: ['abdo', 'abdos', 'abs', 'ventre', 'sangle', 'core', 'tablette', 'six pack', 'sixpack'],
  gainage: ['plank', 'planche', 'gainer'],
  oblique: ['flanc', 'flancs', 'taille', 'cote', 'cotes'],
  dos: ['dorsal', 'dorsaux', 'lats', 'lat', 'back', 'latissimus'],
  trapeze: ['trap', 'traps', 'nuque', 'trapezes'],
  epaule: ['delt', 'delts', 'deltoide', 'deltoides', 'shoulder', 'shoulders', 'epaules'],
  epaulearriere: ['reardelt', 'oiseau'],
  bicep: ['bi', 'biceps', 'biscoto', 'biscotos'],
  tricep: ['tri', 'triceps'],
  avantbra: ['poignet', 'poignets', 'grip', 'poigne', 'forearm', 'forearms', 'avantbras'],
  lombaire: ['lombaires', 'reins', 'lombaire'],
  fessier: ['fesse', 'fesses', 'glute', 'glutes', 'booty', 'fessiers', 'grand fessier', 'cul', 'popotin'],
  quadricep: ['quad', 'quads', 'quadriceps', 'cuisse', 'cuisses'],
  ischio: ['hamstring', 'hamstrings', 'ischios'],
  mollet: ['calf', 'calves', 'mollets', 'soleaire'],
  adducteur: ['adducteurs', 'adductor'],
  abducteur: ['abducteurs', 'abductor', 'moyen fessier'],
  haltere: ['halteres', 'dumbbell', 'dumbbells', 'db', 'halter', 'haltere'],
  barre: ['barbell', 'bb', 'barres'],
  poulie: ['cable', 'cables', 'poulies', 'visavis'],
  machine: ['machines', 'appareil', 'guide', 'smith'],
  kettlebell: ['kb', 'kettle', 'kettlebells', 'kettelbell'],
  elastique: ['bande', 'band', 'elastiques', 'resistance'],
  pdc: ['bodyweight', 'calisthenics', 'calisthenic', 'maison', 'domicile', 'chez', 'naturel'],
  cardio: ['endurance', 'souffle', 'aerobie', 'running'],
  brulegraisse: ['maigrir', 'mincir', 'secher', 'seche', 'perte', 'calorie', 'calories', 'kcal', 'bruler', 'affiner', 'mincir', 'gras', 'graisse'],
  mobilite: ['etirement', 'etirements', 'stretching', 'stretch', 'souplesse', 'echauffement', 'echauffer', 'recuperation', 'assouplissement'],
  developpe: ['dvp', 'devlope', 'press'],
  couche: ['bench', 'benchpress'],
  souleve: ['deadlift', 'sdt'],
  traction: ['pullup', 'pull', 'chin', 'chinup', 'barre fixe'],
  pompe: ['pushup', 'push', 'pompes'],
  fente: ['lunge', 'lunges', 'fentes'],
  rowing: ['row', 'tirage horizontal'],
  tirage: ['pulldown', 'pull down'],
  ecarte: ['fly', 'flye', 'butterfly', 'ecartes'],
  elevation: ['raise', 'raises', 'elevations'],
  extension: ['pushdown', 'extensions'],
  hautcorps: ['upper', 'haut'],
  bascorps: ['lower', 'bas', 'jambe', 'jambes', 'leg', 'legs'],
}

// expansion groups used for broad body-part words
const GROUPS = {
  bra: ['bicep', 'tricep', 'avantbra'], // bras / arms
  arm: ['bicep', 'tricep', 'avantbra'],
  jambe: ['quadricep', 'ischio', 'fessier', 'mollet', 'adducteur'],
  leg: ['quadricep', 'ischio', 'fessier', 'mollet', 'adducteur'],
  bascorp: ['quadricep', 'ischio', 'fessier', 'mollet', 'adducteur'],
  hautcorp: ['pectoral', 'dos', 'epaule', 'bicep', 'tricep'],
  fullbody: ['pectoral', 'dos', 'quadricep', 'fessier', 'epaule'],
  epaulearriere: ['oiseau', 'face', 'reardelt'],
}

const SYN = {}
const MUSCLE_CANON = ['pectoral', 'abdominal', 'oblique', 'dos', 'trapeze', 'epaule', 'bicep', 'tricep', 'avantbra', 'lombaire', 'fessier', 'quadricep', 'ischio', 'mollet', 'adducteur', 'abducteur', 'gainage']
const SYN_CANON = new Set(MUSCLE_CANON)
for (const [canon, list] of Object.entries(SYN_RAW)) {
  const c = tokenize(canon)[0] || canon
  for (const w of [canon, ...list]) {
    const toks = tokenize(w)
    if (toks.length === 1) (SYN[toks[0]] ||= new Set()).add(c) // multi-word synonyms would create false links
    else if (toks.length > 1) (SYN[toks.join('')] ||= new Set()).add(c)
  }
}

const LEVEL_WORDS = {
  debutant: 1, debutante: 1, facile: 1, novice: 1, beginner: 1, simple: 1,
  intermediaire: 2, moyen: 2,
  avance: 3, avancee: 3, difficile: 3, expert: 3, dur: 3, hard: 3, confirme: 3,
}

// ── Index ─────────────────────────────────────────────────────────────────
const W = { name: 10, alias: 8, primary: 6, equipment: 4, cat: 4, secondary: 2.5, level: 2 }

const MUSCLE_TERMS = {
  chest: 'pectoraux pectoral', back: 'dos dorsaux', traps: 'trapezes', shoulders: 'epaules deltoides',
  biceps: 'biceps', triceps: 'triceps', forearms: 'avantbras', abs: 'abdominaux gainage', obliques: 'obliques',
  lowerback: 'lombaires', glutes: 'fessiers abducteurs', quads: 'quadriceps', hamstrings: 'ischio', calves: 'mollets', adductors: 'adducteurs',
}

function buildIndex() {
  return EXERCISES.map((ex) => {
    const fields = {
      name: tokenize(ex.name),
      alias: (ex.aliases || []).flatMap(tokenize),
      primary: ex.primary.flatMap((m) => tokenize(`${MUSCLES[m]} ${MUSCLE_TERMS[m]}`)),
      secondary: ex.secondary.flatMap((m) => tokenize(`${MUSCLES[m]} ${MUSCLE_TERMS[m]}`)),
      equipment: tokenize(ex.equipment),
      cat: tokenize([
        ex.type === 'cardio' && 'cardio', ex.cat === 'mobility' && 'mobilite',
        ex.met >= 7.5 && 'brulegraisse', ex.type === 'time' && ex.cat !== 'mobility' && 'gainage',
      ].filter(Boolean).join(' ')),
      level: tokenize(LEVELS[ex.level]),
    }
    if (ex.equipment === 'Poids du corps' || ex.equipment === 'Élastique') fields.cat.push('pdc')
    return { ex, fields, nameNorm: normalize(ex.name), aliasNorm: (ex.aliases || []).map(normalize) }
  })
}

let INDEX = null
let VOCAB = null
const getIndex = () => (INDEX ||= buildIndex())
function getVocab() {
  if (VOCAB) return VOCAB
  const v = new Set(Object.keys(SYN))
  for (const d of getIndex()) for (const list of Object.values(d.fields)) list.forEach((t) => v.add(t))
  Object.keys(LEVEL_WORDS).forEach((t) => v.add(t))
  Object.keys(GROUPS).forEach((t) => v.add(t))
  return (VOCAB = [...v].filter((t) => t.length > 2))
}

// ── Fuzzy matching ───────────────────────────────────────────────────────
export function distance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      rowMin = Math.min(rowMin, d[i][j])
    }
    if (rowMin > max) return max + 1
  }
  return d[a.length][b.length]
}

// how well query token q matches document token t (0..1)
function tokenMatch(q, t) {
  if (q === t) return 1
  if (q.length >= 2 && t.startsWith(q)) return q.length >= 4 ? 0.9 : 0.75 // typing in progress
  if (t.length >= 4 && q.startsWith(t) && q.length - t.length <= 2) return 0.8 // "squatte" → "squat"
  if (q.length >= 4 && t.length >= 4) {
    const max = q.length >= 8 ? 2 : 1
    const dist = distance(q, t, max)
    if (dist <= max) return dist === 1 ? 0.72 : 0.55
  }
  return 0
}

// alternatives for a query token: itself + synonyms (canonical) + group expansions
function alternatives(q) {
  const alts = [{ t: q, f: GROUPS[q] ? 0.45 : 1 }]
  SYN[q]?.forEach((c) => c !== q && alts.push({ t: c, f: 0.95 }))
  GROUPS[q]?.forEach((c) => alts.push({ t: c, f: 0.85 }))
  // typo on a synonym key ("pecss", "abdo" partial...)
  if (!SYN[q] && q.length >= 4) {
    for (const key of Object.keys(SYN)) {
      if (key.length >= 4 && distance(q, key, 1) <= 1) SYN[key].forEach((c) => alts.push({ t: c, f: 0.8 }))
    }
  }
  return alts
}

const FIELD_LABEL = { name: null, alias: 'nom alternatif', primary: 'muscle', secondary: 'muscle secondaire', equipment: 'matériel', cat: 'catégorie', level: 'niveau' }

function scoreDoc(doc, qTokens) {
  let total = 0
  const reasons = new Map()
  for (const q of qTokens) {
    let best = 0, bestField = null, bestTok = null
    for (const { t, f } of q.alts) {
      for (const [field, toks] of Object.entries(doc.fields)) {
        for (const dt of toks) {
          const m = tokenMatch(t, dt)
          if (!m) continue
          // a muscle reached through a synonym weighs the same wherever it appears (name/alias don't outrank the muscle itself)
          const w = f < 1 && SYN_CANON.has(t) && (field === 'alias' || field === 'name') ? W.primary : W[field]
          const s = m * f * w
          if (s > best) { best = s; bestField = field; bestTok = dt }
        }
      }
    }
    if (!best) return null // every meaningful query token must match (AND)
    total += best
    // the query names a muscle that this exercise primarily targets
    if (q.alts.some((a) => a.f < 1 || SYN_CANON.has(a.t)) && q.alts.some((a) => SYN_CANON.has(a.t) && doc.fields.primary.includes(a.t))) total += 4
    if (bestField && FIELD_LABEL[bestField]) reasons.set(bestField, bestTok)
  }
  return { score: total, reasons }
}

// ── Public API ──────────────────────────────────────────────────────────
/**
 * @returns {{ results: {ex, score, why: string[]}[], ignored: string[], suggestion: string|null, intent: {level?:number} }}
 */
export function searchExercises(query, { pool } = {}) {
  const raw = normalize(query)
  const index = getIndex().filter((d) => !pool || pool.has(d.ex.id))
  if (!raw) return { results: index.map((d) => ({ ex: d.ex, score: 0, why: [] })), ignored: [], suggestion: null, intent: {} }

  const tokens = tokenize(query)
  const intent = {}
  const qTokens = []
  for (const t of tokens) {
    if (LEVEL_WORDS[t]) { intent.level = LEVEL_WORDS[t]; continue }
    qTokens.push({ raw: t, alts: alternatives(t) })
  }

  // drop tokens that match nothing anywhere, and suggest a correction
  const all = getIndex()
  const ignored = []
  const kept = qTokens.filter((q) => {
    const ok = all.some((d) => scoreDoc(d, [q]))
    if (!ok) ignored.push(q.raw)
    return ok
  })

  let results = []
  const nothingUnderstood = qTokens.length > 0 && !kept.length
  const broad = kept.length > 0 && kept.every((q) => GROUPS[q.raw])
  for (const d of nothingUnderstood ? [] : index) {
    if (intent.level && d.ex.level !== intent.level) continue
    const r = kept.length ? scoreDoc(d, kept) : { score: 1, reasons: new Map() }
    if (!r) continue
    let score = r.score
    // phrase bonuses on the name and aliases (not for broad words like "bras" or "jambes")
    if (broad) {
      // compound movements hitting several muscles of the group rank first ("jambes" → squat before calf raise)
      const groupMuscles = new Set(kept.flatMap((q) => GROUPS[q.raw]))
      score += 2.5 * new Set(d.fields.primary.filter((t) => groupMuscles.has(t))).size
    } else if (d.nameNorm === raw || d.aliasNorm.includes(raw)) score += 40
    else if (d.nameNorm.startsWith(raw)) score += 20
    else if (d.nameNorm.includes(raw) || d.aliasNorm.some((a) => a.includes(raw))) score += 12
    if (d.ex.cat === 'mobility' && !kept.some((q) => q.alts.some((a) => a.t === 'mobilite'))) score *= 0.5
    // fat-burning intent favours high MET
    if (kept.some((q) => q.alts.some((a) => a.t === 'brulegraisse'))) score += d.ex.met
    const why = []
    for (const [field, tok] of r.reasons) {
      if (field === 'alias') {
        const a = d.ex.aliases.find((x) => tokenize(x).includes(tok))
        if (a) why.push(`aussi appelé « ${a} »`)
      } else if (field === 'primary' || field === 'secondary') {
        const m = (field === 'primary' ? d.ex.primary : d.ex.secondary).find((mm) => tokenize(`${MUSCLES[mm]} ${MUSCLE_TERMS[mm]}`).includes(tok))
        if (m) why.push(field === 'primary' ? MUSCLES[m] : `${MUSCLES[m]} (secondaire)`)
      } else if (field === 'equipment') why.push(d.ex.equipment)
      else if (field === 'cat') why.push(tok === 'pdc' ? 'sans matériel' : tok === 'brulegraisse' ? 'brûle-calories' : tok === 'mobilite' ? 'mobilité' : tok)
    }
    results.push({ ex: d.ex, score, why: [...new Set(why)] })
  }
  results.sort((a, b) => b.score - a.score || a.ex.name.localeCompare(b.ex.name, 'fr'))

  let suggestion = null
  if (ignored.length) {
    const vocab = getVocab()
    const fixed = ignored.map((w) => {
      const max = Math.max(1, Math.floor(w.length / 3))
      let best = null, bd = max + 1
      for (const v of vocab) {
        const dd = distance(w, v, max)
        if (dd < bd) { bd = dd; best = v }
      }
      return best
    })
    if (fixed.every(Boolean)) suggestion = query.split(/\s+/).map((w) => {
      const t = tokenize(w)[0]
      const i = ignored.indexOf(t)
      return i >= 0 ? displayWord(fixed[i]) : w
    }).join(' ')
  }
  return { results, ignored, suggestion, intent }
}

const DISPLAY = { pdc: 'sans matériel', brulegraisse: 'brûler des calories', avantbra: 'avant-bras', mobilite: 'mobilité', pectoral: 'pectoraux', haltere: 'haltères', epaule: 'épaules', abdominal: 'abdos', fessier: 'fessiers', quadricep: 'quadriceps', mollet: 'mollets', trapeze: 'trapèzes', lombaire: 'lombaires' }
const displayWord = (t) => DISPLAY[t] || t

// autocomplete: best exercise names for a partial query
export function suggestNames(query, n = 6) {
  if (normalize(query).length < 2) return []
  return searchExercises(query).results.slice(0, n).map((r) => r.ex)
}

export const EXAMPLE_QUERIES = ['pecs haltères', 'dos sans matériel', 'fessiers maison', 'abdos débutant', 'brûler des calories', 'épaules poulie', 'bras', 'étirements']
