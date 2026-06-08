import { getDb, newId, nowIso } from '@/lib/db/index';
import { normalizeUsername, compareWeekLabels } from '@/lib/db/shared';
import type {
  AppStats,
  Exercise,
  MuscleGroup,
  Profile,
  TemplateDay,
  TemplateExercise,
  WorkoutSession,
  WorkoutSet,
} from '@/types/database';
import { DEFAULT_MUSCLE_GROUP_NAMES } from '@/types/database';

type ProfileRow = {
  id: string;
  username: string;
  password: string;
  display_name: string | null;
  is_admin: number;
  default_weight_increment: number;
  default_rest_seconds: number;
  weight_unit: 'kg' | 'lb';
  last_seen_at: string | null;
  created_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    is_admin: row.is_admin === 1,
    default_weight_increment: row.default_weight_increment ?? 10,
    default_rest_seconds: row.default_rest_seconds ?? 90,
    weight_unit: row.weight_unit ?? 'lb',
    last_seen_at: row.last_seen_at,
    created_at: row.created_at,
  };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', [id]);
  return row ? mapProfile(row) : null;
}

export async function signInLocal(username: string, password: string): Promise<{ profile: Profile | null; error: string | null }> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT * FROM profiles WHERE username = ? AND password = ?',
    [normalizeUsername(username), password],
  );
  if (!row) return { profile: null, error: 'Usuario o contraseña incorrectos' };
  await touchLastSeen(row.id);
  return { profile: mapProfile(row), error: null };
}

export async function signUpLocal(
  username: string,
  password: string,
): Promise<{ profile: Profile | null; error: string | null }> {
  const db = await getDb();
  const normalized = normalizeUsername(username);
  const existing = await db.getFirstAsync('SELECT id FROM profiles WHERE username = ?', [normalized]);
  if (existing) return { profile: null, error: 'Ese nombre de usuario ya existe' };

  const countRow = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM profiles');
  const isFirstUser = (countRow?.c ?? 0) === 0;
  const id = newId();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO profiles (id, username, password, display_name, is_admin, default_weight_increment, default_rest_seconds, weight_unit, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, normalized, password, username.trim(), isFirstUser ? 1 : 0, 10, 90, 'lb', now, now],
  );

  return { profile: await getProfileById(id), error: null };
}

export async function touchLastSeen(userId: string) {
  const db = await getDb();
  await db.runAsync('UPDATE profiles SET last_seen_at = ? WHERE id = ?', [nowIso(), userId]);
}

export async function updateProfileRestSeconds(userId: string, seconds: number) {
  const clamped = Math.max(15, Math.min(600, Math.round(seconds)));
  const db = await getDb();
  await db.runAsync('UPDATE profiles SET default_rest_seconds = ? WHERE id = ?', [clamped, userId]);
  return { error: null };
}

export async function updateProfileWeightIncrement(userId: string, increment: number) {
  const clamped = Math.max(0.5, Math.min(50, Math.round(increment * 2) / 2));
  const db = await getDb();
  await db.runAsync('UPDATE profiles SET default_weight_increment = ? WHERE id = ?', [
    clamped,
    userId,
  ]);
  return { error: null };
}

export async function updateProfileWeightUnit(userId: string, unit: 'kg' | 'lb') {
  const db = await getDb();
  await db.runAsync('UPDATE profiles SET weight_unit = ? WHERE id = ?', [unit, userId]);
  return { error: null };
}

export type LastExerciseStats = {
  maxWeight: number;
  week_year: number;
  week_number: number;
};

export async function getLastExerciseSessionStats(
  userId: string,
  exerciseId: string,
): Promise<LastExerciseStats | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    max_weight: number;
    week_year: number;
    week_number: number;
  }>(
    `SELECT MAX(ws.weight) as max_weight, s.week_year, s.week_number
     FROM workout_sets ws
     JOIN workout_sessions s ON s.id = ws.session_id
     WHERE s.user_id = ? AND ws.exercise_id = ? AND ws.completed = 1 AND s.completed = 1
     GROUP BY s.id
     ORDER BY s.session_date DESC, s.created_at DESC
     LIMIT 1`,
    [userId, exerciseId],
  );
  if (!row) return null;
  return {
    maxWeight: row.max_weight,
    week_year: row.week_year,
    week_number: row.week_number,
  };
}

export async function updateTemplateDayName(dayId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: 'El nombre no puede estar vacío' };
  const db = await getDb();
  await db.runAsync('UPDATE template_days SET name = ? WHERE id = ?', [trimmed, dayId]);
  return { error: null };
}

export async function updateTemplateExercise(
  id: string,
  targetSets: number,
  targetReps: number,
) {
  const sets = Math.max(1, Math.min(20, Math.round(targetSets)));
  const reps = Math.max(1, Math.min(100, Math.round(targetReps)));
  const db = await getDb();
  await db.runAsync(
    'UPDATE template_exercises SET target_sets = ?, target_reps = ? WHERE id = ?',
    [sets, reps, id],
  );
  return { error: null };
}

export async function deleteExercise(userId: string, exerciseId: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercises WHERE id = ? AND user_id = ?', [exerciseId, userId]);
  return { error: null };
}

export async function getAppStats(): Promise<AppStats> {
  const db = await getDb();
  const total = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM profiles');
  const active7 = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM profiles WHERE last_seen_at >= datetime('now', '-7 days')`,
  );
  const active30 = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM profiles WHERE last_seen_at >= datetime('now', '-30 days')`,
  );
  const new7 = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM profiles WHERE created_at >= datetime('now', '-7 days')`,
  );
  const new30 = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM profiles WHERE created_at >= datetime('now', '-30 days')`,
  );

  return {
    total_users: total?.c ?? 0,
    active_7d: active7?.c ?? 0,
    active_30d: active30?.c ?? 0,
    new_users_7d: new7?.c ?? 0,
    new_users_30d: new30?.c ?? 0,
  };
}

type SessionRow = {
  id: string;
  user_id: string;
  session_date: string;
  week_year: number;
  week_number: number;
  template_day_id: string | null;
  notes: string | null;
  completed: number;
  created_at: string;
};

type SetRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: number;
  from_template: number;
  created_at: string;
};

type SetWithExerciseRow = SetRow & {
  ex_name: string;
  ex_muscle_group: string | null;
  ex_training_day: number | null;
  ex_user_id: string;
};

function mapSession(row: SessionRow): WorkoutSession {
  return { ...row, completed: row.completed === 1 };
}

function mapSetRow(row: SetRow): Omit<WorkoutSet, 'exercise'> {
  return {
    id: row.id,
    session_id: row.session_id,
    exercise_id: row.exercise_id,
    set_number: row.set_number,
    weight: row.weight,
    reps: row.reps,
    completed: row.completed === 1,
    from_template: row.from_template === 1,
    created_at: row.created_at,
  };
}

export async function listExercises(userId: string): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE user_id = ? ORDER BY name',
    [userId],
  );
}

export async function listExercisesByGroup(userId: string, groupId: string): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE user_id = ? AND muscle_group = ? ORDER BY name',
    [userId, groupId],
  );
}

async function ensureDefaultMuscleGroups(userId: string) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM muscle_groups WHERE user_id = ?',
    [userId],
  );
  if ((row?.c ?? 0) > 0) return;

  for (let i = 0; i < DEFAULT_MUSCLE_GROUP_NAMES.length; i++) {
    await db.runAsync(
      'INSERT INTO muscle_groups (id, user_id, name, sort_order) VALUES (?, ?, ?, ?)',
      [newId(), userId, DEFAULT_MUSCLE_GROUP_NAMES[i], i],
    );
  }
}

export async function listMuscleGroups(userId: string): Promise<MuscleGroup[]> {
  await ensureDefaultMuscleGroups(userId);
  const db = await getDb();
  return db.getAllAsync<MuscleGroup>(
    'SELECT * FROM muscle_groups WHERE user_id = ? ORDER BY sort_order, name',
    [userId],
  );
}

export async function getMuscleGroup(userId: string, groupId: string): Promise<MuscleGroup | null> {
  await ensureDefaultMuscleGroups(userId);
  const db = await getDb();
  return db.getFirstAsync<MuscleGroup>(
    'SELECT * FROM muscle_groups WHERE user_id = ? AND id = ?',
    [userId, groupId],
  );
}

export async function addMuscleGroup(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { group: null, error: 'El nombre no puede estar vacío' };

  const db = await getDb();
  try {
    const maxRow = await db.getFirstAsync<{ m: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) as m FROM muscle_groups WHERE user_id = ?',
      [userId],
    );
    const id = newId();
    await db.runAsync(
      'INSERT INTO muscle_groups (id, user_id, name, sort_order) VALUES (?, ?, ?, ?)',
      [id, userId, trimmed, (maxRow?.m ?? -1) + 1],
    );
    const group = await db.getFirstAsync<MuscleGroup>(
      'SELECT * FROM muscle_groups WHERE id = ?',
      [id],
    );
    return { group, error: null };
  } catch {
    return { group: null, error: 'Ya tienes un grupo con ese nombre' };
  }
}

export async function deleteMuscleGroup(userId: string, groupId: string) {
  const db = await getDb();
  const exercises = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM exercises WHERE user_id = ? AND muscle_group = ?',
    [userId, groupId],
  );
  for (const ex of exercises) {
    await deleteExercise(userId, ex.id);
  }
  await db.runAsync('DELETE FROM muscle_groups WHERE id = ? AND user_id = ?', [groupId, userId]);
  return { error: null };
}

export async function listExercisesByDay(userId: string, trainingDay: number): Promise<Exercise[]> {
  const db = await getDb();
  return db.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE user_id = ? AND training_day = ? ORDER BY name',
    [userId, trainingDay],
  );
}

export async function updateExerciseTrainingDay(
  userId: string,
  exerciseId: string,
  trainingDay: number,
) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE exercises SET training_day = ? WHERE id = ? AND user_id = ?',
    [trainingDay, exerciseId, userId],
  );
  return { error: null };
}

export async function addExercise(userId: string, name: string, trainingDay: number) {
  const db = await getDb();
  const id = newId();
  try {
    await db.runAsync(
      'INSERT INTO exercises (id, user_id, name, muscle_group, training_day) VALUES (?, ?, ?, ?, ?)',
      [id, userId, name.trim(), null, trainingDay],
    );
    return { error: null, exerciseId: id };
  } catch {
    return { error: 'Ya tienes ese ejercicio en este día' };
  }
}

export async function listTemplateDays(userId: string): Promise<TemplateDay[]> {
  const db = await getDb();
  return db.getAllAsync<TemplateDay>(
    'SELECT * FROM template_days WHERE user_id = ? ORDER BY day_of_week',
    [userId],
  );
}

export async function listTemplateExercises(dayIds: string[]): Promise<TemplateExercise[]> {
  if (dayIds.length === 0) return [];
  const db = await getDb();
  const placeholders = dayIds.map(() => '?').join(',');
  const templateRows = await db.getAllAsync<TemplateExercise>(
    `SELECT * FROM template_exercises WHERE template_day_id IN (${placeholders}) ORDER BY sort_order`,
    dayIds,
  );

  const exerciseIds = [...new Set(templateRows.map((r: TemplateExercise) => r.exercise_id))];
  if (exerciseIds.length === 0) return templateRows;

  const exPlaceholders = exerciseIds.map(() => '?').join(',');
  const exercises = await db.getAllAsync<Exercise>(
    `SELECT * FROM exercises WHERE id IN (${exPlaceholders})`,
    exerciseIds,
  );
  const exMap = Object.fromEntries(exercises.map((e: Exercise) => [e.id, e]));

  return templateRows.map((te: TemplateExercise) => ({
    ...te,
    exercise: exMap[te.exercise_id],
  }));
}

export async function ensureTemplateDay(userId: string, dayOfWeek: number, name: string): Promise<TemplateDay | null> {
  const db = await getDb();
  const existing = await db.getFirstAsync<TemplateDay>(
    'SELECT * FROM template_days WHERE user_id = ? AND day_of_week = ?',
    [userId, dayOfWeek],
  );
  if (existing) return existing;

  const id = newId();
  await db.runAsync(
    'INSERT INTO template_days (id, user_id, day_of_week, name) VALUES (?, ?, ?, ?)',
    [id, userId, dayOfWeek, name],
  );
  return db.getFirstAsync<TemplateDay>('SELECT * FROM template_days WHERE id = ?', [id]);
}

export async function addTemplateExercise(
  dayId: string,
  exerciseId: string,
  sortOrder: number,
  targetSets = 3,
  targetReps = 8,
) {
  const db = await getDb();
  try {
    await db.runAsync(
      `INSERT INTO template_exercises (id, template_day_id, exercise_id, sort_order, target_sets, target_reps)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newId(), dayId, exerciseId, sortOrder, targetSets, targetReps],
    );
    return { error: null };
  } catch {
    return { error: 'No se pudo añadir el ejercicio' };
  }
}

export async function removeTemplateExercise(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM template_exercises WHERE id = ?', [id]);
}

export async function listWorkoutSessions(userId: string, limit = 50): Promise<WorkoutSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY session_date DESC LIMIT ?',
    [userId, limit],
  );
  return rows.map(mapSession);
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM workout_sessions WHERE id = ?',
    [id],
  );
  return row ? mapSession(row) : null;
}

export async function getSessionSets(sessionId: string): Promise<WorkoutSet[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SetWithExerciseRow>(
    `SELECT ws.*, e.name as ex_name, e.muscle_group as ex_muscle_group,
            e.training_day as ex_training_day, e.user_id as ex_user_id
     FROM workout_sets ws
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.session_id = ?
     ORDER BY ws.set_number`,
    [sessionId],
  );

  return rows.map((r: SetWithExerciseRow) => ({
    ...mapSetRow(r),
    exercise: {
      id: r.exercise_id,
      user_id: r.ex_user_id,
      name: r.ex_name,
      muscle_group: r.ex_muscle_group,
      training_day: r.ex_training_day,
      created_at: r.created_at,
    },
  }));
}

export async function startWorkoutSession(
  userId: string,
  templateDayId: string | null,
  weekYear: number,
  weekNumber: number,
  sessionDate: string,
): Promise<{ session: WorkoutSession | null; error: string | null }> {
  const db = await getDb();
  const id = newId();
  try {
    await db.runAsync(
      `INSERT INTO workout_sessions (id, user_id, session_date, week_year, week_number, template_day_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, sessionDate, weekYear, weekNumber, templateDayId],
    );
    const session = await getWorkoutSession(id);
    return { session, error: null };
  } catch {
    return { session: null, error: 'No se pudo crear la sesión' };
  }
}

export async function saveWorkoutSets(
  sessionId: string,
  sets: Omit<WorkoutSet, 'id' | 'created_at' | 'exercise'>[],
) {
  const db = await getDb();
  await db.runAsync('DELETE FROM workout_sets WHERE session_id = ?', [sessionId]);
  for (const s of sets) {
    await db.runAsync(
      `INSERT INTO workout_sets (id, session_id, exercise_id, set_number, weight, reps, completed, from_template)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId(), s.session_id, s.exercise_id, s.set_number, s.weight, s.reps, s.completed ? 1 : 0, s.from_template ? 1 : 0],
    );
  }
  await db.runAsync('UPDATE workout_sessions SET completed = 1 WHERE id = ?', [sessionId]);
}

export async function getPastSetsForExercise(userId: string, exerciseId: string, limit = 20): Promise<SetRow[]> {
  const db = await getDb();
  return db.getAllAsync<SetRow>(
    `SELECT ws.* FROM workout_sets ws
     JOIN workout_sessions s ON s.id = ws.session_id
     WHERE s.user_id = ? AND ws.exercise_id = ?
     ORDER BY ws.created_at DESC
     LIMIT ?`,
    [userId, exerciseId, limit],
  );
}

export async function getExerciseProgress(userId: string, exerciseId: string) {
  const db = await getDb();
  const rows = await db.getAllAsync<{ week_number: number; week_year: number; weight: number }>(
    `SELECT s.week_number, s.week_year, ws.weight
     FROM workout_sets ws
     JOIN workout_sessions s ON s.id = ws.session_id
     WHERE s.user_id = ? AND ws.exercise_id = ? AND ws.completed = 1`,
    [userId, exerciseId],
  );

  const byWeek: Record<string, number> = {};
  for (const row of rows) {
    const key = `S${row.week_number} ${row.week_year}`;
    byWeek[key] = Math.max(byWeek[key] ?? 0, row.weight);
  }

  return Object.entries(byWeek)
    .map(([weekLabel, maxWeight]) => ({ weekLabel, maxWeight }))
    .sort((a, b) => compareWeekLabels(a.weekLabel, b.weekLabel));
}

export async function listUserSessionIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM workout_sessions WHERE user_id = ?',
    [userId],
  );
  return rows.map((r: { id: string }) => r.id);
}
