export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert = Row, Update = Partial<Row>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] }

type ProfileRow = { id: string; username: string; display_name: string; first_name: string; avatar_url: string | null; public_handle: string; public_code: string; discoverable: boolean; profile_visibility: 'discoverable' | 'private'; progress_visibility: 'household' | 'followers' | 'private'; height_cm: number | null; weight_kg: number | null; daily_step_goal: number; daily_calorie_goal: number; active: boolean; created_at: string; updated_at: string }
type NutritionRow = { id: string; user_id: string; calories: number; protein: number; carbs: number; fats: number; fiber: number; notes: string; starts_on: string; updated_at: string }
type HouseholdRow = { id: string; name: string; household_type: 'duo' | 'house'; legacy_couple_id: string | null; owner_user_id: string; max_members: number; created_at: string; updated_at: string }
type HouseholdMemberRow = { household_id: string; user_id: string; role: 'owner' | 'member'; joined_at: string; left_at: string | null }
type HouseholdInvitationRow = { id: string; household_id: string; inviter_user_id: string; invitee_user_id: string | null; token_hash: string | null; status: 'pending' | 'accepted' | 'expired' | 'revoked' | 'declined'; expires_at: string; accepted_at: string | null; revoked_at: string | null; created_at: string }
type ProfileFollowRow = { id: string; follower_id: string; followed_id: string; status: 'pending' | 'accepted' | 'rejected' | 'blocked'; created_at: string; updated_at: string; accepted_at: string | null }
type FoodSourceRow = { id: string; source_key: string; name: string; source_url: string; license: string; attribution: string; imported_at: string; metadata: Json; created_at: string; updated_at: string }
type FoodRow = { id: string; source_id: string; external_id: string; name: string; name_es: string; name_en: string | null; description: string; category: string; subcategory: string; food_group: string; brand: string | null; barcode: string | null; default_unit: string; is_basic_food: boolean; is_packaged: boolean; metadata: Json; created_at: string; updated_at: string }
type FoodNutrientsRow = { id: string; food_id: string; basis: 'per_100g' | 'per_100ml' | 'per_unit'; calories: number | null; protein_g: number | null; carbohydrates_g: number | null; fat_g: number | null; fiber_g: number | null; saturated_fat_g: number | null; sugar_g: number | null; sodium_mg: number | null; cholesterol_mg: number | null; micronutrients: Json; created_at: string; updated_at: string }
type FoodPortionRow = { id: string; food_id: string; label: string; unit: string; grams: number | null; ml: number | null; is_default: boolean; metadata: Json; created_at: string; updated_at: string }
type FoodFavoriteRow = { user_id: string; food_id: string; created_at: string }
type FoodAliasRow = { id: string; food_id: string; alias: string; language: string; created_at: string }
type RecipeRow = { id: string; created_by: string | null; household_id: string | null; name: string; name_es: string; description: string; instructions: string; prep_time_minutes: number; cook_time_minutes: number; servings: number; image_url: string | null; visibility: 'private' | 'household' | 'system'; created_at: string; updated_at: string }
type RecipeIngredientRow = { id: string; recipe_id: string; food_id: string; food_portion_id: string | null; quantity: number; unit: string; normalized_grams: number | null; normalized_ml: number | null; notes: string; order_index: number; created_at: string; updated_at: string }
type FoodLogRow = { id: string; user_id: string; household_id: string | null; visibility: 'private' | 'household'; consumed_on: string; consumed_at: string; meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | 'other'; notes: string; created_at: string; updated_at: string }
type FoodLogItemRow = { id: string; food_log_id: string; food_id: string | null; recipe_id: string | null; food_portion_id: string | null; quantity: number; unit: string; normalized_grams: number | null; normalized_ml: number | null; precision: 'exact' | 'estimated' | 'portion'; notes: string; created_at: string; updated_at: string }
type MealPlanRow = { id: string; user_id: string; household_id: string | null; name: string; starts_on: string; ends_on: string; visibility: 'private' | 'household'; created_at: string; updated_at: string }
type MealPlanDayRow = { id: string; meal_plan_id: string; plan_date: string; notes: string; created_at: string; updated_at: string }
type PlannedMealRow = { id: string; meal_plan_day_id: string; meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | 'other'; scheduled_time: string | null; food_id: string | null; recipe_id: string | null; quantity: number | null; unit: string | null; servings: number | null; planned_calories: number | null; planned_protein_g: number | null; planned_carbohydrates_g: number | null; planned_fat_g: number | null; planned_fiber_g: number | null; notes: string; status: 'planned' | 'completed' | 'logged'; completed_at: string | null; logged_at: string | null; created_at: string; updated_at: string }
type GroceryListRow = { id: string; household_id: string; created_by: string | null; starts_on: string; ends_on: string; status: 'current' | 'completed' | 'archived'; created_at: string; updated_at: string }
type GroceryItemRow = { id: string; grocery_list_id: string; food_id: string | null; name: string; name_es: string; name_en: string; category: string; source: 'planned' | 'manual' | 'recipe-derived'; calculated_quantity: number | null; calculated_unit: string | null; manual_quantity: number | null; manual_unit: string | null; suggested_quantity: number | null; suggested_unit: string | null; status: 'pending' | 'purchased'; notes: string; metadata: Json; created_at: string; updated_at: string }
type ExerciseRow = { id: string; external_id: string; name: string; name_es: string; description: string; instructions: Json; muscle_group: string; target: string; category: string; equipment: string; video_url: string | null; thumbnail_url: string | null; image_url: string | null; source: string; source_url: string | null; metadata: Json; created_at: string; updated_at: string }
type WorkoutDayRow = { id: string; user_id: string; name: string; name_es: string; description: string; weekday: number; order_index: number; active: boolean; estimated_minutes: number; created_at: string; updated_at: string }
type WorkoutExerciseRow = { id: string; workout_day_id: string; exercise_id: string; order_index: number; sets: number; target_reps: number; target_seconds: number | null; target_weight: number; rest_seconds: number; notes: string; created_at: string; updated_at: string }
type SessionRow = { id: string; user_id: string; workout_day_id: string | null; started_at: string; finished_at: string | null; duration_seconds: number; overall_feeling: number; energy: number; fatigue: number; mood: number; difficulty: number; notes: string; status: 'active' | 'completed' | 'abandoned'; created_at: string; updated_at: string }
type SetRow = { id: string; session_id: string; exercise_id: string; set_number: number; planned_weight: number; actual_weight: number; planned_reps: number; actual_reps: number; difficulty: number; feeling: number; pain_level: number; rest_seconds: number; notes: string; completed_at: string }
type DailyMetricRow = { id: string; user_id: string; date: string; steps: number; calories: number; body_weight: number | null; notes: string; created_at: string; updated_at: string }
type PersonalRecordRow = { id: string; user_id: string; exercise_id: string | null; record_type: 'weight' | 'reps' | 'volume' | 'streak' | 'steps'; value: number; unit: string; achieved_at: string; label: string }
type ActivityEventRow = { id: string; user_id: string; event_type: 'workout_completed' | 'step_goal_reached' | 'personal_record' | 'workout_started' | 'metric_updated'; title: string; description: string; entity_type: string; entity_id: string | null; metadata: Json; created_at: string }

export interface Database {
  public: {
    Tables: {
      couples: Table<{ id: string; name: string; created_at: string }>
      couple_members: Table<{ couple_id: string; user_id: string; joined_at: string }>
      households: Table<HouseholdRow>
      household_members: Table<HouseholdMemberRow>
      household_invitations: Table<HouseholdInvitationRow>
      profile_follows: Table<ProfileFollowRow>
      profiles: Table<ProfileRow>
      nutrition_plans: Table<NutritionRow>
      food_sources: Table<FoodSourceRow>
      foods: Table<FoodRow>
      food_nutrients: Table<FoodNutrientsRow>
      food_portions: Table<FoodPortionRow>
      food_aliases: Table<FoodAliasRow>
      food_favorites: Table<FoodFavoriteRow>
      recipes: Table<RecipeRow>
      recipe_ingredients: Table<RecipeIngredientRow>
      food_logs: Table<FoodLogRow>
      food_log_items: Table<FoodLogItemRow>
      meal_plans: Table<MealPlanRow>
      meal_plan_days: Table<MealPlanDayRow>
      planned_meals: Table<PlannedMealRow>
      grocery_lists: Table<GroceryListRow>
      grocery_list_items: Table<GroceryItemRow>
      exercises: Table<ExerciseRow>
      workout_days: Table<WorkoutDayRow>
      workout_exercises: Table<WorkoutExerciseRow>
      workout_sessions: Table<SessionRow>
      exercise_sets: Table<SetRow>
      daily_metrics: Table<DailyMetricRow>
      personal_records: Table<PersonalRecordRow>
      activity_events: Table<ActivityEventRow>
      strategy_versions: Table<{ id: string; user_id: string; name: string; starts_on: string; ends_on: string | null; is_current: boolean; snapshot: Json; created_at: string }>
    }
    Views: {
      public_profiles: { Row: { id: string; public_handle: string; public_code: string; display_name: string; first_name: string; avatar_url: string | null; discoverable: boolean }; Relationships: [] }
    }
    Functions: {
      health_check: { Args: Record<string, never>; Returns: Json }
      is_couple_member: { Args: { target_user_id: string }; Returns: boolean }
      is_household_member: { Args: { target_household_id: string; target_user_id?: string }; Returns: boolean }
      is_household_owner: { Args: { target_household_id: string; target_user_id?: string }; Returns: boolean }
      is_same_household_user: { Args: { target_user_id: string; viewer_user_id?: string }; Returns: boolean }
      search_public_profiles: { Args: { search_query: string; result_limit: number }; Returns: Json }
      add_household_member: { Args: { p_household_id: string; p_user_id: string; p_role: string }; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
