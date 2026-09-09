export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Language = 'en' | 'es'

export type SessionStatus = 'active' | 'completed' | 'abandoned'

export type ActivityEventType =
  | 'workout_completed'
  | 'step_goal_reached'
  | 'personal_record'
  | 'workout_started'
  | 'metric_updated'

export type NutritionBasis = 'per_100g' | 'per_100ml' | 'per_unit'
export type FoodSourceType = 'system' | 'user'

export interface CreateCustomFoodInput {
  name: string
  brand?: string
  category?: string
  servingSize: number
  servingUnit: FoodUnit
  calories: number
  protein?: number | null
  carbs?: number | null
  fat?: number | null
  fiber?: number | null
  sugar?: number | null
  sodiumMg?: number | null
  saturatedFat?: number | null
  notes?: string
}

export type FoodUnit = 'g' | 'kg' | 'mg' | 'ml' | 'l' | 'unit' | 'cup' | 'tablespoon' | 'teaspoon' | 'slice' | 'portion' | 'piece'

export interface FoodSource {
  id: string
  sourceKey: string
  name: string
  sourceUrl: string
  license: string
  attribution: string
  importedAt: string
  metadata: Record<string, Json>
  createdAt: string
  updatedAt: string
}

export interface FoodNutrition {
  id: string
  foodId: string
  basis: NutritionBasis
  calories: number | null
  proteinG: number | null
  carbohydratesG: number | null
  fatG: number | null
  fiberG: number | null
  saturatedFatG: number | null
  sugarG: number | null
  sodiumMg: number | null
  cholesterolMg: number | null
  micronutrients: Record<string, number | null>
  createdAt: string
  updatedAt: string
}

export interface FoodPortion {
  id: string
  foodId: string
  label: string
  unit: FoodUnit
  grams: number | null
  milliliters: number | null
  isDefault: boolean
  metadata: Record<string, Json>
  createdAt: string
  updatedAt: string
}

export interface Food {
  id: string
  sourceId: string
  externalId: string
  sourceType: FoodSourceType
  ownerUserId?: string
  archivedAt?: string | null
  name: string
  nameEs: string
  nameEn: string
  description: string
  category: string
  categoryEs: string
  categoryEn: string
  subcategory: string
  subcategoryEs: string
  subcategoryEn: string
  foodGroup: string
  brand: string
  barcode: string
  defaultUnit: FoodUnit
  isBasicFood: boolean
  isPackaged: boolean
  metadata: Record<string, Json>
  source?: FoodSource
  nutrients: FoodNutrition[]
  portions: FoodPortion[]
  createdAt: string
  updatedAt: string
}

export type RecipeVisibility = 'private' | 'household' | 'system'

export interface RecipeIngredient {
  id: string
  recipeId: string
  foodId: string
  foodPortionId?: string
  quantity: number
  unit: FoodUnit
  normalizedGrams: number | null
  normalizedMilliliters: number | null
  notes: string
  orderIndex: number
  food?: Food
  portion?: FoodPortion
  createdAt: string
  updatedAt: string
}

export interface Recipe {
  id: string
  createdBy: string | null
  householdId?: string | null
  name: string
  nameEs: string
  description: string
  instructions: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  imageUrl: string
  visibility: RecipeVisibility
  ingredients: RecipeIngredient[]
  createdAt: string
  updatedAt: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | 'other'
export type FoodPrecision = 'exact' | 'estimated' | 'portion'
export type FoodLogVisibility = 'private' | 'household'

export interface FoodLogItem {
  id: string
  foodLogId: string
  foodId: string | null
  recipeId: string | null
  foodPortionId?: string
  quantity: number
  unit: FoodUnit
  normalizedGrams: number | null
  normalizedMilliliters: number | null
  precision: FoodPrecision
  notes: string
  food?: Food
  recipe?: Recipe
  portion?: FoodPortion
  createdAt: string
  updatedAt: string
}

export interface FoodLog {
  id: string
  userId: string
  householdId?: string | null
  visibility: 'private' | 'household'
  consumedOn: string
  consumedAt: string
  mealType: MealType
  notes: string
  items: FoodLogItem[]
  createdAt: string
  updatedAt: string
}

export type MealPlanVisibility = 'private' | 'household'
export type PlannedMealStatus = 'planned' | 'completed' | 'logged'

export interface PlannedMeal {
  id: string
  mealPlanDayId: string
  mealType: MealType
  scheduledTime: string | null
  foodId: string | null
  recipeId: string | null
  quantity: number | null
  unit: FoodUnit | null
  servings: number | null
  plannedCalories: number | null
  plannedProteinG: number | null
  plannedCarbohydratesG: number | null
  plannedFatG: number | null
  plannedFiberG: number | null
  notes: string
  status: PlannedMealStatus
  completedAt: string | null
  loggedAt: string | null
  food?: Food
  recipe?: Recipe
  createdAt: string
  updatedAt: string
}

export interface MealPlanDay {
  id: string
  mealPlanId: string
  planDate: string
  notes: string
  meals: PlannedMeal[]
  createdAt: string
  updatedAt: string
}

export interface MealPlan {
  id: string
  userId: string
  householdId?: string | null
  name: string
  startsOn: string
  endsOn: string
  visibility: MealPlanVisibility
  days: MealPlanDay[]
  createdAt: string
  updatedAt: string
}

export type GroceryListStatus = 'current' | 'completed' | 'archived'
export type GroceryItemStatus = 'pending' | 'purchased'
export type GroceryItemSource = 'planned' | 'manual' | 'recipe-derived'
export type GroceryItemCategory = 'produce' | 'protein' | 'dairy' | 'grains' | 'pantry' | 'frozen' | 'beverages' | 'snacks' | 'other'
export type GroceryPurchaseUnit = 'g' | 'kg' | 'ml' | 'l' | 'unit' | 'dozen'

export interface GroceryListItem {
  id: string
  groceryListId: string
  foodId: string | null
  name: string
  nameEs: string
  nameEn: string
  category: GroceryItemCategory
  source: GroceryItemSource
  calculatedQuantity: number | null
  calculatedUnit: GroceryPurchaseUnit | null
  manualQuantity: number | null
  manualUnit: GroceryPurchaseUnit | null
  suggestedQuantity: number | null
  suggestedUnit: GroceryPurchaseUnit | null
  status: GroceryItemStatus
  notes: string
  metadata: Record<string, Json>
  food?: Food
  createdAt: string
  updatedAt: string
}

export interface GroceryList {
  id: string
  householdId: string
  createdBy: string | null
  startsOn: string
  endsOn: string
  status: GroceryListStatus
  items: GroceryListItem[]
  createdAt: string
  updatedAt: string
}

export type LivePhase = 'ready' | 'set' | 'rest' | 'complete'

export interface Profile {
  id: string
  username: string
  publicHandle: string
  publicCode: string
  discoverable: boolean
  profileVisibility: 'discoverable' | 'private'
  progressVisibility: 'household' | 'followers' | 'private'
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

export type HouseholdType = 'duo' | 'house'
export type HouseholdRole = 'owner' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked' | 'declined'
export type FollowStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'
export type SpaceType = 'duo' | 'household' | 'coaching'
export type SpaceRole = 'owner' | 'coach' | 'athlete' | 'member' | 'admin'
export type SpaceMemberStatus = 'pending' | 'active' | 'inactive'
export type CoachAthleteStatus = 'pending' | 'active' | 'paused' | 'revoked' | 'ended'
export type UserCapability = 'household_create' | 'coaching_create'
export type StrategyManagementMode = 'self' | 'coach'
export type StrategyManagementStatus = 'active' | 'ended'
export type CoachPermission = 'strategy_view' | 'strategy_manage' | 'progress_view' | 'execution_view' | 'nutrition_view' | 'nutrition_manage' | 'notes_manage' | 'athlete_manage'

export interface CoachNote {
  id: string
  content: string
  visibility: 'private' | 'shared'
  createdAt: string
  updatedAt: string
}

export interface StrategyVersionSummary {
  id: string
  versionNumber: number | null
  status: 'draft' | 'published' | 'archived'
  name: string
  changeReason: string
  createdBy: string | null
  createdAt: string
  publishedAt: string | null
  snapshot?: Json
}

export interface StrategyManagement {
  athleteUserId: string
  managerUserId: string | null
  spaceId: string | null
  relationshipId: string | null
  managementMode: StrategyManagementMode
  status: StrategyManagementStatus
  startedAt: string
  endedAt: string | null
}

export interface Space {
  id: string
  ownerUserId: string
  name: string
  type: SpaceType
  maxMembers: number
  status: 'active' | 'archived'
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SpaceMember {
  id: string
  spaceId: string
  userId: string
  role: SpaceRole
  status: SpaceMemberStatus
  joinedAt: string
  leftAt: string | null
}

export interface CoachAthleteRelationship {
  id: string
  spaceId: string
  coachUserId: string
  athleteUserId: string
  status: CoachAthleteStatus
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CoachingAthleteOverview extends CoachingAthlete {
  dailyStepGoal: number
  dailyCalorieGoal: number
  weightKg: number
  latestBodyWeight: number | null
  latestSteps: number | null
  lastWorkoutAt: string | null
  workoutsLast7Days: number
  volumeLast7Days: number
  personalRecordsCount: number
}

export interface CoachingAthlete {
  athleteUserId: string
  displayName: string
  publicHandle: string
  publicCode: string
  avatarUrl?: string
  relationshipStatus: 'active'
  relationshipStartedAt: string | null
}

export interface SpaceInvitation {
  id: string
  spaceId: string
  inviterUserId: string
  inviteeUserId: string
  relationshipType: 'coach_athlete'
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
  spaceName?: string
  inviterName?: string
  inviterHandle?: string
}

export interface Household {
  id: string
  name: string
  householdType: HouseholdType
  legacyCoupleId: string | null
  ownerUserId: string
  maxMembers: number
  createdAt: string
  updatedAt: string
}

export interface HouseholdMember {
  householdId: string
  userId: string
  role: HouseholdRole
  joinedAt: string
  leftAt: string | null
  profile?: Profile
}

export interface HouseholdInvitation {
  id: string
  householdId: string
  inviterUserId: string
  inviteeUserId: string | null
  tokenHash: string | null
  status: InvitationStatus
  expiresAt: string
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
  household?: Household
  inviter?: Profile
}

export interface ProfileFollow {
  id: string
  followerId: string
  followedId: string
  status: FollowStatus
  createdAt: string
  updatedAt: string
  acceptedAt: string | null
  follower?: Profile
  followed?: Profile
}

export interface PublicProfile {
  id: string
  publicHandle: string
  publicCode: string
  displayName: string
  firstName?: string
  avatarUrl?: string
  discoverable: boolean
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
  ownerUserId?: string | null
  ownerSpaceId?: string | null
  visibility?: 'private' | 'space' | 'public' | 'system'
  status?: 'active' | 'archived'
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
