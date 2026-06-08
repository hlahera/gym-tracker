export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  is_admin: boolean;
  default_weight_increment: number;
  default_rest_seconds: number;
  weight_unit: 'kg' | 'lb';
  last_seen_at: string | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  user_id: string;
  name: string;
  /** ID del grupo muscular */
  muscle_group: string | null;
  /** Día de entrenamiento: 0=Dom … 6=Sáb */
  training_day: number | null;
  created_at: string;
};

export type MuscleGroup = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export const DEFAULT_MUSCLE_GROUP_NAMES = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Hombros',
  'Bíceps',
  'Tríceps',
] as const;

export type TemplateDay = {
  id: string;
  user_id: string;
  day_of_week: number;
  name: string;
  created_at: string;
};

export type TemplateExercise = {
  id: string;
  template_day_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  created_at: string;
  exercise?: Exercise;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  session_date: string;
  week_year: number;
  week_number: number;
  template_day_id: string | null;
  notes: string | null;
  completed: boolean;
  created_at: string;
};

export type WorkoutSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
  from_template: boolean;
  created_at: string;
  exercise?: Exercise;
};

export type AppStats = {
  total_users: number;
  active_7d: number;
  active_30d: number;
  new_users_7d: number;
  new_users_30d: number;
};

export type ExerciseProgress = {
  exerciseId: string;
  exerciseName: string;
  weeks: { weekLabel: string; maxWeight: number; totalReps: number }[];
  suggestedWeight: number;
};

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

export const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Piernas',
  'Glúteos',
  'Cuádriceps',
  'Isquios',
  'Pantorrillas',
  'Core',
  'Antebrazos',
  'Trapecios',
  'Cardio',
  'Cuerpo completo',
  'Otro',
] as const;
