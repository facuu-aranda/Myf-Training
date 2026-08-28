export type Language = 'en' | 'es'

export type SessionStatus = 'active' | 'completed' | 'abandoned'

export type ActivityEventType =
  | 'workout_completed'
  | 'step_goal_reached'
  | 'personal_record'
  | 'workout_started'
  | 'metric_updated'

export type LivePhase = 'ready' | 'set' | 'rest' | 'complete'

export interface Profile {
  id: string
  username: string
  displayName: string
  firstName: string
  avatarUrl: string
  heightCm: number
  weightKg: number
  dailyStepGoal: number
  dailyCalorieGoal: number
  active: boolean
  createdAt: string
  updatedAt: string
  passwordHash?: string
}

export interface NutritionPlan {
  id: string
  userId: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  notes: string
  startsOn: string
  updatedAt: string
}

export interface Exercise {
  id: string
  externalId: string
  name: string
  nameEs: string
  description: string
  instructions: string[]
  instructionsEs: string[]
  category: string
  muscleGroup: string
  target: string
  equipment: string
  gifUrl?: string
  imageUrl?: string
  source: string
  sourceUrl: string
}

export interface WorkoutExercise {
  id: string
  workoutDayId: string
  exerciseId: string
  orderIndex: number
  sets: number
  targetReps: number
  targetSeconds?: number
  targetWeight: number
  restSeconds: number
  notes: string
}

export interface WorkoutDay {
  id: string
  userId: string
  name: string
  nameEs: string
  description: string
  weekday: number
  orderIndex: number
  active: boolean
  estimatedMinutes: number
  exercises: WorkoutExercise[]
  createdAt: string
  updatedAt: string
}

export interface ExerciseSet {
  id: string
  sessionId: string
  exerciseId: string
  setNumber: number
  plannedWeight: number
  actualWeight: number
  plannedReps: number
  actualReps: number
  difficulty: number
  feeling: number
  painLevel: number
  restSeconds: number
  notes: string
  completedAt: string
}

export interface WorkoutSession {
  id: string
  userId: string
  workoutDayId: string
  startedAt: string
  finishedAt?: string
  durationSeconds: number
  overallFeeling: number
  energy: number
  fatigue: number
  mood: number
  difficulty: number
  notes: string
  status: SessionStatus
  sets: ExerciseSet[]
}

export interface DailyMetric {
  id: string
  userId: string
  date: string
  steps: number
  calories: number
  bodyWeight: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PersonalRecord {
  id: string
  userId: string
  exerciseId?: string
  recordType: 'weight' | 'reps' | 'volume' | 'streak' | 'steps'
  value: number
  unit: string
  achievedAt: string
  label: string
}

export interface ActivityEvent {
  id: string
  userId: string
  eventType: ActivityEventType
  title: string
  description: string
  entityType: string
  entityId?: string
  metadata?: Record<string, string | number>
  createdAt: string
}

export interface AppState {
  profiles: Profile[]
  nutritionPlans: NutritionPlan[]
  exercises: Exercise[]
  workoutDays: WorkoutDay[]
  sessions: WorkoutSession[]
  dailyMetrics: DailyMetric[]
  personalRecords: PersonalRecord[]
  activityEvents: ActivityEvent[]
}

export interface DashboardStats {
  steps: number
  stepGoal: number
  calories: number
  calorieGoal: number
  workoutsThisWeek: number
  plannedWorkoutsThisWeek: number
  currentStreak: number
  totalVolume: number
}

export interface CoupleSummary {
  profile: Profile
  workouts: number
  steps: number
  prs: number
  streak: number
  weeklyVolume: number
}

export interface LiveSetDraft {
  weight: string
  reps: string
  difficulty: number
  feeling: number
  pain: number
  notes: string
}

export interface QuickLogEntry {
  plan: WorkoutExercise
  draft: LiveSetDraft
  setsCompleted: number
}
