import type {
  ActivityEvent,
  AppState,
  DailyMetric,
  Exercise,
  ExerciseSet,
  NutritionPlan,
  PersonalRecord,
  Profile,
  WorkoutDay,
  WorkoutExercise,
  WorkoutSession,
} from '../types'
import { daysAgo, getDateKey } from '../lib/utils'

const datasetRoot = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main'
const datasetSource = 'https://github.com/hasaneyldrm/exercises-dataset'

export const demoProfiles: Profile[] = [
  {
    id: 'user-fabricio',
    username: 'fabricio',
    displayName: 'Fabricio Ruiz',
    firstName: 'Fabricio',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85',
    heightCm: 181,
    weightKg: 82.4,
    dailyStepGoal: 10000,
    dailyCalorieGoal: 2200,
    active: true,
    createdAt: '2025-01-12T10:00:00.000Z',
    updatedAt: '2026-08-26T09:30:00.000Z',
  },
  {
    id: 'user-maria',
    username: 'maria',
    displayName: 'María Santos',
    firstName: 'María',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=85',
    heightCm: 168,
    weightKg: 62.8,
    dailyStepGoal: 9000,
    dailyCalorieGoal: 1900,
    active: true,
    createdAt: '2025-01-12T10:00:00.000Z',
    updatedAt: '2026-08-25T18:20:00.000Z',
  },
]

export const demoExercises: Exercise[] = [
  {
    id: 'exercise-squat',
    externalId: '0043',
    name: 'Barbell Full Squat',
    nameEs: 'Sentadilla completa con barra',
    description: 'A full-range lower body strength movement built around control, depth and a stable brace.',
    instructions: ['Stand with the bar across your upper back.', 'Brace your core and sit down between your hips.', 'Drive through the floor to return to standing.'],
    instructionsEs: ['Coloca la barra sobre la parte alta de la espalda.', 'Activa el core y baja llevando la cadera entre los pies.', 'Empuja el suelo para volver a la posición inicial.'],
    category: 'Upper legs', muscleGroup: 'Quadriceps', target: 'Quads', equipment: 'Barbell',
    gifUrl: `${datasetRoot}/videos/0043-qXTaZnJ.gif`, imageUrl: `${datasetRoot}/images/0043-qXTaZnJ.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-deadlift', externalId: '0032', name: 'Barbell Deadlift', nameEs: 'Peso muerto con barra',
    description: 'A powerful hinge pattern for the posterior chain with a long, controlled pull from the floor.',
    instructions: ['Set your feet under the bar and hinge at the hips.', 'Keep the bar close while standing tall.', 'Lower it with control and reset before the next rep.'],
    instructionsEs: ['Coloca los pies bajo la barra y flexiona la cadera.', 'Mantén la barra cerca del cuerpo mientras te elevas.', 'Baja con control y vuelve a colocarte antes de repetir.'],
    category: 'Back', muscleGroup: 'Hamstrings', target: 'Glutes', equipment: 'Barbell',
    gifUrl: `${datasetRoot}/videos/0032-ila4NZS.gif`, imageUrl: `${datasetRoot}/images/0032-ila4NZS.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-bench', externalId: '0025', name: 'Barbell Bench Press', nameEs: 'Press de banca con barra',
    description: 'A classic horizontal push focused on a strong setup and a smooth bar path.',
    instructions: ['Set your eyes below the bar and plant both feet.', 'Lower the bar toward the middle of your chest.', 'Press up while keeping your shoulder blades stable.'],
    instructionsEs: ['Coloca los ojos bajo la barra y apoya bien los pies.', 'Baja la barra hacia el centro del pecho.', 'Empuja manteniendo los omóplatos estables.'],
    category: 'Chest', muscleGroup: 'Chest', target: 'Pectoralis major', equipment: 'Barbell',
    gifUrl: `${datasetRoot}/videos/0025-EIeI8Vf.gif`, imageUrl: `${datasetRoot}/images/0025-EIeI8Vf.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-pullup', externalId: '0652', name: 'Pull-up', nameEs: 'Dominada',
    description: 'A bodyweight pull that builds back strength through a steady, full range of motion.',
    instructions: ['Grip the bar slightly wider than your shoulders.', 'Pull your chest toward the bar without swinging.', 'Lower until your arms are long and repeat.'],
    instructionsEs: ['Sujeta la barra un poco más allá de los hombros.', 'Lleva el pecho hacia la barra sin balancearte.', 'Baja hasta extender los brazos y repite.'],
    category: 'Back', muscleGroup: 'Lats', target: 'Lats', equipment: 'Body weight',
    gifUrl: `${datasetRoot}/videos/0652-lBDjFxJ.gif`, imageUrl: `${datasetRoot}/images/0652-lBDjFxJ.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-curl', externalId: '0294', name: 'Dumbbell Biceps Curl', nameEs: 'Curl de bíceps con mancuernas',
    description: 'A focused arm movement that rewards a quiet torso and a deliberate squeeze at the top.',
    instructions: ['Stand tall with a dumbbell in each hand.', 'Curl without moving your elbows forward.', 'Lower slowly and keep tension through the full range.'],
    instructionsEs: ['Colócate erguido con una mancuerna en cada mano.', 'Flexiona sin llevar los codos hacia delante.', 'Baja lentamente y mantén la tensión durante todo el recorrido.'],
    category: 'Upper arms', muscleGroup: 'Biceps', target: 'Biceps', equipment: 'Dumbbell',
    gifUrl: `${datasetRoot}/videos/0294-NbVPDMW.gif`, imageUrl: `${datasetRoot}/images/0294-NbVPDMW.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-lateral', externalId: '0334', name: 'Dumbbell Lateral Raise', nameEs: 'Elevación lateral con mancuernas',
    description: 'A controlled shoulder isolation movement for building calm, consistent time under tension.',
    instructions: ['Hold the dumbbells by your sides with a soft elbow bend.', 'Raise until your arms are level with your shoulders.', 'Lower slowly without shrugging.'],
    instructionsEs: ['Sujeta las mancuernas junto al cuerpo con los codos relajados.', 'Eleva hasta que los brazos queden a la altura de los hombros.', 'Baja despacio sin encoger los hombros.'],
    category: 'Shoulders', muscleGroup: 'Deltoids', target: 'Deltoid', equipment: 'Dumbbell',
    gifUrl: `${datasetRoot}/videos/0334-DsgkuIt.gif`, imageUrl: `${datasetRoot}/images/0334-DsgkuIt.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-hip-thrust', externalId: '0573', name: 'Barbell Hip Thrust', nameEs: 'Empuje de cadera con barra',
    description: 'A glute-focused bridge pattern with a stable upper back and a deliberate lockout.',
    instructions: ['Rest your upper back against a bench with the bar over your hips.', 'Drive through your feet and lift your hips.', 'Pause at the top, then lower with control.'],
    instructionsEs: ['Apoya la parte alta de la espalda en un banco con la barra sobre la cadera.', 'Empuja con los pies y eleva la cadera.', 'Pausa arriba y baja con control.'],
    category: 'Upper legs', muscleGroup: 'Glutes', target: 'Glutes', equipment: 'Barbell',
    gifUrl: `${datasetRoot}/videos/0573-7S8wP0m.gif`, imageUrl: `${datasetRoot}/images/0573-7S8wP0m.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-plank', externalId: '0664', name: 'Plank', nameEs: 'Plancha',
    description: 'A simple isometric hold for trunk control, breathing and total-body tension.',
    instructions: ['Place your forearms under your shoulders.', 'Create one long line from head to heels.', 'Breathe slowly while keeping your ribs stacked.'],
    instructionsEs: ['Coloca los antebrazos bajo los hombros.', 'Forma una línea larga desde la cabeza hasta los talones.', 'Respira despacio manteniendo las costillas alineadas.'],
    category: 'Waist', muscleGroup: 'Abs', target: 'Abs', equipment: 'Body Weight',
    gifUrl: `${datasetRoot}/videos/0664-8xQ0C5Y.gif`, imageUrl: `${datasetRoot}/images/0664-8xQ0C5Y.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
  {
    id: 'exercise-row', externalId: '0168', name: 'Cable Seated Row', nameEs: 'Remo sentado en polea',
    description: 'A horizontal pull that builds upper-back control without rushing the return.',
    instructions: ['Sit tall and hold the handle with your arms long.', 'Pull toward your waist while keeping your chest open.', 'Return slowly and let the shoulder blades move naturally.'],
    instructionsEs: ['Siéntate erguido con los brazos extendidos.', 'Lleva el agarre hacia la cintura manteniendo el pecho abierto.', 'Vuelve despacio dejando que los omóplatos se muevan con naturalidad.'],
    category: 'Back', muscleGroup: 'Upper back', target: 'Rhomboids', equipment: 'Cable',
    gifUrl: `${datasetRoot}/videos/0168-qy1v8mN.gif`, imageUrl: `${datasetRoot}/images/0168-qy1v8mN.jpg`, source: 'exercises-dataset', sourceUrl: datasetSource,
  },
]

function workoutExercise(id: string, dayId: string, exerciseId: string, orderIndex: number, sets: number, targetReps: number, targetWeight: number, restSeconds: number, notes = ''): WorkoutExercise {
  return { id, workoutDayId: dayId, exerciseId, orderIndex, sets, targetReps, targetWeight, restSeconds, notes }
}

function makeDays(userId: string, prefix: string, spanish: boolean): WorkoutDay[] {
  const lowerId = `${prefix}-lower`
  const upperId = `${prefix}-upper`
  const engineId = `${prefix}-engine`
  const now = new Date().toISOString()
  return [
    {
      id: lowerId, userId, name: 'Lower strength', nameEs: spanish ? 'Fuerza de piernas' : 'Fuerza de piernas', description: 'Build a stronger base with controlled, repeatable work.', weekday: 1, orderIndex: 0, active: true, estimatedMinutes: 48, createdAt: now, updatedAt: now,
      exercises: [
        workoutExercise(`${lowerId}-1`, lowerId, 'exercise-squat', 0, 4, 8, userId === 'user-maria' ? 45 : 70, 90),
        workoutExercise(`${lowerId}-2`, lowerId, 'exercise-deadlift', 1, 3, 8, userId === 'user-maria' ? 55 : 90, 120),
        workoutExercise(`${lowerId}-3`, lowerId, 'exercise-hip-thrust', 2, 3, 10, userId === 'user-maria' ? 55 : 80, 90),
      ],
    },
    {
      id: upperId, userId, name: 'Upper focus', nameEs: spanish ? 'Tren superior' : 'Tren superior', description: 'Press, pull and leave the room feeling taller.', weekday: 3, orderIndex: 1, active: true, estimatedMinutes: 42, createdAt: now, updatedAt: now,
      exercises: [
        workoutExercise(`${upperId}-1`, upperId, 'exercise-bench', 0, 4, 8, userId === 'user-maria' ? 32.5 : 60, 90),
        workoutExercise(`${upperId}-2`, upperId, 'exercise-pullup', 1, 3, 6, 0, 90),
        workoutExercise(`${upperId}-3`, upperId, 'exercise-row', 2, 3, 10, userId === 'user-maria' ? 30 : 50, 75),
        workoutExercise(`${upperId}-4`, upperId, 'exercise-lateral', 3, 3, 12, userId === 'user-maria' ? 5 : 9, 60),
      ],
    },
    {
      id: engineId, userId, name: 'Engine & core', nameEs: spanish ? 'Cardio y core' : 'Cardio y core', description: 'A lighter session to keep the rhythm without forcing it.', weekday: 5, orderIndex: 2, active: true, estimatedMinutes: 32, createdAt: now, updatedAt: now,
      exercises: [
        workoutExercise(`${engineId}-1`, engineId, 'exercise-plank', 0, 3, 0, 0, 0, 'Hold for 45 seconds'),
        workoutExercise(`${engineId}-2`, engineId, 'exercise-curl', 1, 3, 12, userId === 'user-maria' ? 7.5 : 12, 60),
        workoutExercise(`${engineId}-3`, engineId, 'exercise-lateral', 2, 3, 15, userId === 'user-maria' ? 4 : 7, 45),
      ],
    },
  ]
}

function makeSet(sessionId: string, exerciseId: string, setNumber: number, plannedWeight: number, plannedReps: number, actualWeight: number, actualReps: number, completedAt: string): ExerciseSet {
  return { id: `${sessionId}-${exerciseId}-${setNumber}`, sessionId, exerciseId, setNumber, plannedWeight, actualWeight, plannedReps, actualReps, difficulty: 6 + (setNumber % 3), feeling: 4, painLevel: 0, restSeconds: 90, notes: '', completedAt }
}

function makeHistoricalSession(userId: string, day: WorkoutDay, offset: number, multiplier: number): WorkoutSession {
  const start = daysAgo(offset)
  start.setHours(18, 10, 0, 0)
  const finish = new Date(start.getTime() + (day.estimatedMinutes - 4) * 60000)
  const sessionId = `session-${userId}-${offset}`
  const sets = day.exercises.flatMap((exercise) => Array.from({ length: exercise.sets }, (_, index) => makeSet(
    sessionId, exercise.exerciseId, index + 1, exercise.targetWeight, exercise.targetReps,
    exercise.targetWeight * multiplier + (index === exercise.sets - 1 ? 2.5 : 0),
    Math.max(1, exercise.targetReps - (index === exercise.sets - 1 ? 1 : 0)), finish.toISOString(),
  )))
  return { id: sessionId, userId, workoutDayId: day.id, startedAt: start.toISOString(), finishedAt: finish.toISOString(), durationSeconds: (finish.getTime() - start.getTime()) / 1000, overallFeeling: 4, energy: 4, fatigue: 3, mood: 5, difficulty: 7, notes: '', status: 'completed', sets }
}

function makeMetrics(userId: string, baseSteps: number, baseCalories: number, baseWeight: number): DailyMetric[] {
  return Array.from({ length: 21 }, (_, index) => {
    const date = daysAgo(20 - index)
    const steps = baseSteps + ((index * 733) % 2800) - 700
    const calories = baseCalories + ((index * 97) % 480) - 150
    return { id: `metric-${userId}-${getDateKey(date)}`, userId, date: getDateKey(date), steps: Math.max(3500, steps), calories: Math.max(800, calories), bodyWeight: Number((baseWeight - index * 0.035).toFixed(1)), notes: '', createdAt: date.toISOString(), updatedAt: date.toISOString() }
  })
}

const fabricioDays = makeDays('user-fabricio', 'fabricio', false)
const mariaDays = makeDays('user-maria', 'maria', true)
const historicalSessions = [
  makeHistoricalSession('user-fabricio', fabricioDays[0], 1, 1.02), makeHistoricalSession('user-fabricio', fabricioDays[1], 3, 0.98), makeHistoricalSession('user-fabricio', fabricioDays[2], 5, 1.01), makeHistoricalSession('user-fabricio', fabricioDays[0], 8, 0.95), makeHistoricalSession('user-fabricio', fabricioDays[1], 10, 0.96), makeHistoricalSession('user-fabricio', fabricioDays[2], 13, 0.94),
  makeHistoricalSession('user-maria', mariaDays[0], 2, 1.01), makeHistoricalSession('user-maria', mariaDays[1], 4, 1.02), makeHistoricalSession('user-maria', mariaDays[2], 6, 0.99), makeHistoricalSession('user-maria', mariaDays[0], 9, 0.96), makeHistoricalSession('user-maria', mariaDays[1], 12, 0.97),
]

const now = new Date().toISOString()

const nutritionPlans: NutritionPlan[] = [
  { id: 'nutrition-fabricio', userId: 'user-fabricio', calories: 2200, protein: 180, carbs: 220, fats: 70, fiber: 30, notes: 'Keep protein steady around training days.', startsOn: '2026-07-01', updatedAt: now },
  { id: 'nutrition-maria', userId: 'user-maria', calories: 1900, protein: 135, carbs: 190, fats: 62, fiber: 28, notes: 'Prioritize a calm, consistent breakfast.', startsOn: '2026-07-01', updatedAt: now },
]

const personalRecords: PersonalRecord[] = [
  { id: 'pr-fabricio-squat', userId: 'user-fabricio', exerciseId: 'exercise-squat', recordType: 'weight', value: 77.5, unit: 'kg', achievedAt: daysAgo(1).toISOString(), label: 'Barbell Full Squat · max weight' },
  { id: 'pr-fabricio-deadlift', userId: 'user-fabricio', exerciseId: 'exercise-deadlift', recordType: 'weight', value: 95, unit: 'kg', achievedAt: daysAgo(3).toISOString(), label: 'Barbell Deadlift · max weight' },
  { id: 'pr-fabricio-streak', userId: 'user-fabricio', recordType: 'streak', value: 8, unit: 'days', achievedAt: daysAgo(4).toISOString(), label: 'Longest training streak' },
  { id: 'pr-maria-squat', userId: 'user-maria', exerciseId: 'exercise-squat', recordType: 'weight', value: 50, unit: 'kg', achievedAt: daysAgo(2).toISOString(), label: 'Barbell Full Squat · max weight' },
  { id: 'pr-maria-bench', userId: 'user-maria', exerciseId: 'exercise-bench', recordType: 'weight', value: 37.5, unit: 'kg', achievedAt: daysAgo(4).toISOString(), label: 'Barbell Bench Press · max weight' },
  { id: 'pr-maria-streak', userId: 'user-maria', recordType: 'streak', value: 6, unit: 'days', achievedAt: daysAgo(6).toISOString(), label: 'Longest training streak' },
]

const activityEvents: ActivityEvent[] = [
  { id: 'event-1', userId: 'user-maria', eventType: 'personal_record', title: 'María reached a new PR', description: 'Barbell Bench Press · 37.5 kg', entityType: 'personal_record', entityId: 'pr-maria-bench', createdAt: daysAgo(1).toISOString() },
  { id: 'event-2', userId: 'user-fabricio', eventType: 'workout_completed', title: 'Fabricio completed Upper focus', description: '42 min · 3,840 kg volume', entityType: 'workout_session', entityId: 'session-user-fabricio-3', createdAt: daysAgo(2).toISOString() },
  { id: 'event-3', userId: 'user-maria', eventType: 'step_goal_reached', title: 'María reached her step goal', description: '9,842 steps · nice rhythm', entityType: 'daily_metric', createdAt: daysAgo(2).toISOString() },
  { id: 'event-4', userId: 'user-fabricio', eventType: 'workout_completed', title: 'Fabricio completed Lower strength', description: '48 min · 5,120 kg volume', entityType: 'workout_session', entityId: 'session-user-fabricio-1', createdAt: daysAgo(3).toISOString() },
  { id: 'event-5', userId: 'user-maria', eventType: 'workout_completed', title: 'María completed Engine & core', description: '32 min · 2,180 kg volume', entityType: 'workout_session', entityId: 'session-user-maria-6', createdAt: daysAgo(6).toISOString() },
]

export const demoState: AppState = {
  profiles: demoProfiles,
  nutritionPlans,
  exercises: demoExercises,
  workoutDays: [...fabricioDays, ...mariaDays],
  sessions: historicalSessions,
  dailyMetrics: [...makeMetrics('user-fabricio', 8700, 1780, 82.4), ...makeMetrics('user-maria', 7900, 1570, 62.8)],
  personalRecords,
  activityEvents,
}
