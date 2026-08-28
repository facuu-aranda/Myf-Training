export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert = Row, Update = Partial<Row>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] }

type ProfileRow = { id: string; username: string; display_name: string; first_name: string; avatar_url: string | null; height_cm: number | null; weight_kg: number | null; daily_step_goal: number; daily_calorie_goal: number; active: boolean; created_at: string; updated_at: string }
type NutritionRow = { id: string; user_id: string; calories: number; protein: number; carbs: number; fats: number; fiber: number; notes: string; starts_on: string; updated_at: string }
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
      profiles: Table<ProfileRow>
      nutrition_plans: Table<NutritionRow>
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
    Views: Record<string, never>
    Functions: {
      health_check: { Args: Record<string, never>; Returns: Json }
      is_couple_member: { Args: { target_user_id: string }; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
