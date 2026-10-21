// Exercises with a real-photo demo in public/demos (2 frames + thumbnail).
// Photos: Free Exercise DB (github.com/yuhonas/free-exercise-db), public domain (Unlicense).
export const DEMO_IDS = new Set([
  'ab-wheel', 'abductor-machine', 'adductor-machine', 'air-bike', 'arnold-press', 'band-pull-apart', 'barbell-curl',
  'barbell-row', 'barbell-shrug', 'battle-rope', 'bench-dips', 'bench-press', 'bicycle-crunch', 'bike', 'box-jump',
  'brisk-walk', 'bulgarian-split', 'bw-squat', 'cable-crossover', 'cable-crunch', 'cable-curl', 'cable-kickback',
  'cable-lateral', 'calf-raise', 'cat-cow', 'chest-fly', 'chest-press-machine', 'chest-stretch', 'chin-up',
  'close-grip-bench', 'close-grip-pulldown', 'concentration-curl', 'crunch', 'db-bench-press', 'db-bent-row',
  'db-curl', 'db-pullover', 'db-row', 'db-shoulder-press', 'dead-bug', 'deadlift', 'decline-bench', 'decline-push-up',
  'diamond-push-up', 'dips', 'elliptical', 'ez-curl', 'face-pull', 'farmer-walk', 'foam-roll', 'front-raise',
  'front-squat', 'glute-bridge', 'goblet-squat', 'good-morning', 'hack-squat', 'hammer-curl', 'hamstring-stretch',
  'hanging-leg-raise', 'hip-flexor-stretch', 'hip-thrust', 'hyperextension', 'incline-bench', 'incline-curl',
  'incline-db-press', 'incline-walk', 'inverted-row', 'jump-rope', 'jump-squat', 'jumping-jack', 'kb-swing',
  'lat-pulldown', 'lateral-raise', 'leg-curl', 'leg-extension', 'leg-press', 'leg-press-calf', 'lunge', 'lying-leg-raise',
  'machine-row', 'machine-shoulder-press', 'mountain-climber', 'nordic-curl', 'ohp', 'overhead-cable-ext',
  'overhead-ext', 'pallof-press', 'pec-deck', 'plank', 'power-clean', 'preacher-curl', 'pull-up', 'push-up',
  'rack-pull', 'rdl', 'rear-delt-fly', 'reverse-crunch', 'reverse-curl', 'reverse-lunge', 'reverse-pec-deck',
  'rower', 'russian-twist', 'seated-calf', 'seated-leg-curl', 'seated-row', 'shoulder-dislocate', 'shrug',
  'side-plank', 'sit-up', 'skull-crusher', 'sled-push', 'smith-bench', 'smith-squat', 'sprint', 'squat',
  'stairmaster', 'step-up', 'straight-arm-pulldown', 'sumo-deadlift', 'sumo-squat', 'tbar-row', 'thruster',
  'treadmill-run', 'triceps-kickback', 'triceps-pushdown', 'upright-row', 'walking-lunge', 'woodchopper',
  'worlds-greatest', 'wrist-curl',
])

export const hasDemo = (id) => DEMO_IDS.has(id)
export const demoFrame = (id, i) => `/demos/${id}-${i}.webp`
export const demoThumb = (id) => `/demos/${id}-t.webp`
