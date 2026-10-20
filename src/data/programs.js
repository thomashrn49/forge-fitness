// Built-in programs. Each day is a workout template.
// exercise entry: [exerciseId, sets, repsTarget, restSeconds]

const day = (id, name, focus, list) => ({
  id, name, focus,
  exercises: list.map(([exId, sets, reps, rest]) => ({ exId, sets, reps, rest })),
})

export const PROGRAMS = [
  {
    id: 'ppl',
    name: 'Push · Pull · Legs',
    tagline: 'Le classique de l’hypertrophie',
    level: 2,
    perWeek: '3–6',
    goal: 'muscle',
    accent: 'from-primary/30',
    description: 'Divise le corps en poussée, tirage et jambes. Fais le cycle une ou deux fois par semaine selon ta disponibilité.',
    days: [
      day('ppl-push', 'Push', 'Pectoraux · Épaules · Triceps', [
        ['bench-press', 4, '6-8', 150], ['incline-db-press', 3, '8-10', 120], ['ohp', 3, '8-10', 120],
        ['lateral-raise', 4, '12-15', 60], ['triceps-pushdown', 3, '10-12', 60], ['overhead-ext', 3, '12', 60],
      ]),
      day('ppl-pull', 'Pull', 'Dos · Biceps · Arrière d’épaule', [
        ['deadlift', 3, '5', 180], ['pull-up', 4, '6-10', 120], ['barbell-row', 3, '8-10', 120],
        ['face-pull', 3, '15', 60], ['barbell-curl', 3, '10', 60], ['hammer-curl', 3, '12', 60],
      ]),
      day('ppl-legs', 'Legs', 'Quadriceps · Ischios · Fessiers', [
        ['squat', 4, '6-8', 180], ['rdl', 3, '8-10', 120], ['leg-press', 3, '10-12', 120],
        ['leg-curl', 3, '12', 60], ['calf-raise', 4, '12-15', 60], ['hanging-leg-raise', 3, '10-15', 60],
      ]),
    ],
  },
  {
    id: 'upper-lower',
    name: 'Haut · Bas',
    tagline: 'Force et volume équilibrés',
    level: 2,
    perWeek: '4',
    goal: 'strength',
    accent: 'from-info/30',
    description: 'Quatre séances par semaine qui alternent haut et bas du corps : chaque muscle est travaillé deux fois.',
    days: [
      day('ul-upper', 'Haut du corps', 'Pectoraux · Dos · Épaules · Bras', [
        ['bench-press', 4, '5-6', 150], ['barbell-row', 4, '6-8', 120], ['db-shoulder-press', 3, '8-10', 90],
        ['lat-pulldown', 3, '10', 90], ['db-curl', 2, '12', 60], ['triceps-pushdown', 2, '12', 60],
      ]),
      day('ul-lower', 'Bas du corps', 'Quadriceps · Ischios · Fessiers · Mollets', [
        ['squat', 4, '5-6', 180], ['rdl', 3, '8', 120], ['bulgarian-split', 3, '10', 90],
        ['leg-extension', 3, '12', 60], ['calf-raise', 4, '12', 60], ['plank', 3, '45', 45],
      ]),
    ],
  },
  {
    id: 'fullbody',
    name: 'Full Body',
    tagline: 'Idéal pour débuter',
    level: 1,
    perWeek: '2–3',
    goal: 'maintain',
    accent: 'from-success/30',
    description: 'Tout le corps à chaque séance, avec des mouvements de base. Alterne A et B, avec un jour de repos entre deux séances.',
    days: [
      day('fb-a', 'Full Body A', 'Squat · Développé · Tirage', [
        ['goblet-squat', 3, '10-12', 90], ['db-bench-press', 3, '10', 90], ['lat-pulldown', 3, '10-12', 90],
        ['db-shoulder-press', 2, '12', 60], ['plank', 3, '30-45', 45],
      ]),
      day('fb-b', 'Full Body B', 'Charnière · Rowing · Fentes', [
        ['rdl', 3, '10', 90], ['seated-row', 3, '10-12', 90], ['lunge', 3, '10/jambe', 90],
        ['push-up', 3, 'max', 60], ['dead-bug', 3, '10/côté', 45],
      ]),
    ],
  },
  {
    id: 'fatburn',
    name: 'Sèche & cardio',
    tagline: 'Maximise la dépense calorique',
    level: 2,
    perWeek: '3–4',
    goal: 'lose',
    accent: 'from-danger/30',
    description: 'Des circuits métaboliques et du cardio fractionné pour brûler un maximum de calories tout en gardant ta masse musculaire.',
    days: [
      day('fat-circuit', 'Circuit métabolique', 'Corps entier · Haute intensité', [
        ['kb-swing', 4, '20', 45], ['goblet-squat', 4, '15', 45], ['push-up', 4, '15', 45],
        ['db-row', 4, '12', 45], ['mountain-climber', 4, '40', 30], ['burpee', 3, '12', 45],
      ]),
      day('fat-hiit', 'HIIT & core', 'Cardio · Abdominaux', [
        ['hiit', 1, '20', 60], ['russian-twist', 3, '20', 30], ['plank', 3, '45', 30], ['crunch', 3, '20', 30],
      ]),
      day('fat-steady', 'Cardio long', 'Endurance · Zone 2', [
        ['incline-walk', 1, '30', 60], ['rower', 1, '15', 60],
      ]),
    ],
  },
  {
    id: 'abs15',
    name: 'Abdos express',
    tagline: '15 minutes, partout',
    level: 1,
    perWeek: '2–4',
    goal: 'maintain',
    accent: 'from-warning/30',
    description: 'Un bloc court de gainage à placer en fin de séance ou les jours de repos.',
    days: [
      day('abs-core', 'Core 15', 'Abdominaux · Obliques · Lombaires', [
        ['plank', 3, '45', 30], ['side-plank', 2, '30', 30], ['crunch', 3, '20', 30],
        ['russian-twist', 3, '20', 30], ['dead-bug', 2, '12', 30],
      ]),
    ],
  },
]

export const ALL_TEMPLATES = PROGRAMS.flatMap((p) => p.days.map((d) => ({ ...d, programId: p.id, programName: p.name })))
export const TEMPLATE_BY_ID = Object.fromEntries(ALL_TEMPLATES.map((t) => [t.id, t]))
