import AsyncStorage from '@react-native-async-storage/async-storage';

import { daysWithin, newId, nowIso, normalizeUsername, compareWeekLabels } from '@/lib/db/shared';
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

const STORAGE_KEY = 'gym_tracker_db_v1';

type ProfileRow = {
  id: string;
  username: string;
  password: string;
  display_name: string | null;
  is_admin: number;
  default_weight_increment: number;
  default_rest_seconds?: number;
  weight_unit?: 'kg' | 'lb';
  last_seen_at: string | null;
  created_at: string;
  email?: string;
};

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

type DbSnapshot = {
  profiles: ProfileRow[];
  muscle_groups: MuscleGroup[];
  exercises: Exercise[];
  template_days: TemplateDay[];
  template_exercises: TemplateExercise[];
  workout_sessions: SessionRow[];
  workout_sets: SetRow[];
};

const emptyDb = (): DbSnapshot => ({
  profiles: [],
  muscle_groups: [],
  exercises: [],
  template_days: [],
  template_exercises: [],
  workout_sessions: [],
  workout_sets: [],
});

let cache: DbSnapshot | null = null;
let loadPromise: Promise<DbSnapshot> | null = null;

function normalizeDb(raw: Partial<DbSnapshot> | null | undefined): DbSnapshot {
  const base = emptyDb();
  if (!raw || typeof raw !== 'object') return base;

  return {
    profiles: Array.isArray(raw.profiles) ? raw.profiles : [],
    muscle_groups: Array.isArray(raw.muscle_groups) ? raw.muscle_groups : [],
    exercises: Array.isArray(raw.exercises) ? raw.exercises : [],
    template_days: Array.isArray(raw.template_days) ? raw.template_days : [],
    template_exercises: Array.isArray(raw.template_exercises) ? raw.template_exercises : [],
    workout_sessions: Array.isArray(raw.workout_sessions) ? raw.workout_sessions : [],
    workout_sets: Array.isArray(raw.workout_sets) ? raw.workout_sets : [],
  };
}

function migrateExercises(db: DbSnapshot): DbSnapshot {
  for (const e of db.exercises) {
    if (e.training_day === undefined) e.training_day = null;
  }
  return db;
}

function migrateProfiles(db: DbSnapshot): DbSnapshot {
  for (const p of db.profiles) {
    if (!p.username && p.email) {
      p.username = normalizeUsername(p.email);
      delete p.email;
    }
    if (p.default_rest_seconds == null) p.default_rest_seconds = 90;
    if (p.weight_unit == null) p.weight_unit = 'lb';
    if (p.default_weight_increment == null) {
      p.default_weight_increment = p.weight_unit === 'lb' ? 10 : 2.5;
    }
    if (p.is_admin == null) p.is_admin = 0;
    // Migrar cuentas antiguas en kg (2.5) a lb con +10 lb semanal
    if (p.weight_unit === 'lb' && p.default_weight_increment === 2.5) {
      p.default_weight_increment = 10;
    }
  }
  return db;
}

async function loadDb(): Promise<DbSnapshot> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        cache = emptyDb();
        return cache;
      }
      const parsed = JSON.parse(raw) as Partial<DbSnapshot>;
      cache = migrateExercises(migrateProfiles(normalizeDb(parsed)));
      return cache;
    } catch {
      cache = emptyDb();
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      } catch {
        // localStorage bloqueado o lleno
      }
      return cache;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/** Precarga la DB al iniciar la app web */
export async function preloadDb(): Promise<void> {
  await loadDb();
}

async function saveDb(db: DbSnapshot): Promise<void> {
  cache = db;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

async function mutate(fn: (db: DbSnapshot) => void): Promise<DbSnapshot> {
  const db = migrateProfiles(normalizeDb(JSON.parse(JSON.stringify(await loadDb()))));
  fn(db);
  await saveDb(db);
  return db;
}

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

export async function getProfileById(id: string): Promise<Profile | null> {
  const db = await loadDb();
  const row = db.profiles.find((p) => p.id === id);
  return row ? mapProfile(row) : null;
}

export async function signInLocal(username: string, password: string) {
  const db = await loadDb();
  const normalized = normalizeUsername(username);
  const row = db.profiles.find((p) => p.username === normalized && p.password === password);
  if (!row) return { profile: null, error: 'Usuario o contraseña incorrectos' };
  await touchLastSeen(row.id);
  return { profile: mapProfile(row), error: null };
}

export async function signUpLocal(username: string, password: string) {
  const normalized = normalizeUsername(username);
  const db = await loadDb();
  if (db.profiles.some((p) => p.username === normalized)) {
    return { profile: null, error: 'Ese nombre de usuario ya existe' };
  }

  const id = newId();
  const now = nowIso();
  const row: ProfileRow = {
    id,
    username: normalized,
    password,
    display_name: username.trim(),
    is_admin: db.profiles.length === 0 ? 1 : 0,
    default_weight_increment: 10,
    default_rest_seconds: 90,
    weight_unit: 'lb',
    last_seen_at: now,
    created_at: now,
  };

  await mutate((d) => {
    d.profiles.push(row);
  });

  return { profile: mapProfile(row), error: null };
}

export async function touchLastSeen(userId: string) {
  await mutate((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (p) p.last_seen_at = nowIso();
  });
}

export async function updateProfileRestSeconds(userId: string, seconds: number) {
  const clamped = Math.max(15, Math.min(600, Math.round(seconds)));
  await mutate((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (p) p.default_rest_seconds = clamped;
  });
  return { error: null };
}

export async function updateProfileWeightIncrement(userId: string, increment: number) {
  const clamped = Math.max(0.5, Math.min(50, Math.round(increment * 2) / 2));
  await mutate((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (p) p.default_weight_increment = clamped;
  });
  return { error: null };
}

export async function updateProfileWeightUnit(userId: string, unit: 'kg' | 'lb') {
  await mutate((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (p) p.weight_unit = unit;
  });
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
  const db = await loadDb();
  const sessions = db.workout_sessions
    .filter((s) => s.user_id === userId && s.completed === 1)
    .sort((a, b) => {
      const byDate = b.session_date.localeCompare(a.session_date);
      if (byDate !== 0) return byDate;
      return b.created_at.localeCompare(a.created_at);
    });

  for (const session of sessions) {
    const sets = db.workout_sets.filter(
      (s) => s.session_id === session.id && s.exercise_id === exerciseId && s.completed === 1,
    );
    if (sets.length === 0) continue;
    return {
      maxWeight: Math.max(...sets.map((s) => s.weight)),
      week_year: session.week_year,
      week_number: session.week_number,
    };
  }
  return null;
}

export async function updateTemplateDayName(dayId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: 'El nombre no puede estar vacío' };
  await mutate((db) => {
    const day = db.template_days.find((d) => d.id === dayId);
    if (day) day.name = trimmed;
  });
  return { error: null };
}

export async function updateTemplateExercise(
  id: string,
  targetSets: number,
  targetReps: number,
) {
  const sets = Math.max(1, Math.min(20, Math.round(targetSets)));
  const reps = Math.max(1, Math.min(100, Math.round(targetReps)));
  await mutate((db) => {
    const te = db.template_exercises.find((x) => x.id === id);
    if (te) {
      te.target_sets = sets;
      te.target_reps = reps;
    }
  });
  return { error: null };
}

export async function deleteExercise(userId: string, exerciseId: string) {
  await mutate((db) => {
    db.template_exercises = db.template_exercises.filter((te) => te.exercise_id !== exerciseId);
    db.workout_sets = db.workout_sets.filter((ws) => ws.exercise_id !== exerciseId);
    db.exercises = db.exercises.filter((e) => !(e.id === exerciseId && e.user_id === userId));
  });
  return { error: null };
}

export async function getAppStats(): Promise<AppStats> {
  const db = await loadDb();
  return {
    total_users: db.profiles.length,
    active_7d: db.profiles.filter((p) => daysWithin(p.last_seen_at, 7)).length,
    active_30d: db.profiles.filter((p) => daysWithin(p.last_seen_at, 30)).length,
    new_users_7d: db.profiles.filter((p) => daysWithin(p.created_at, 7)).length,
    new_users_30d: db.profiles.filter((p) => daysWithin(p.created_at, 30)).length,
  };
}

export async function listExercises(userId: string): Promise<Exercise[]> {
  const db = await loadDb();
  return db.exercises.filter((e) => e.user_id === userId).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listExercisesByGroup(userId: string, groupId: string): Promise<Exercise[]> {
  const db = await loadDb();
  return db.exercises
    .filter((e) => e.user_id === userId && e.muscle_group === groupId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function ensureDefaultMuscleGroups(userId: string) {
  const db = await loadDb();
  const existing = db.muscle_groups.filter((g) => g.user_id === userId);
  if (existing.length > 0) return;

  await mutate((d) => {
    DEFAULT_MUSCLE_GROUP_NAMES.forEach((name, index) => {
      d.muscle_groups.push({
        id: newId(),
        user_id: userId,
        name,
        sort_order: index,
        created_at: nowIso(),
      });
    });
  });
}

export async function listMuscleGroups(userId: string): Promise<MuscleGroup[]> {
  await ensureDefaultMuscleGroups(userId);
  const db = await loadDb();
  return db.muscle_groups
    .filter((g) => g.user_id === userId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export async function getMuscleGroup(
  userId: string,
  groupId: string,
): Promise<MuscleGroup | null> {
  await ensureDefaultMuscleGroups(userId);
  const db = await loadDb();
  return db.muscle_groups.find((g) => g.user_id === userId && g.id === groupId) ?? null;
}

export async function addMuscleGroup(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { group: null, error: 'El nombre no puede estar vacío' };

  const db = await loadDb();
  const normalized = trimmed.toLowerCase();
  if (
    db.muscle_groups.some(
      (g) => g.user_id === userId && g.name.trim().toLowerCase() === normalized,
    )
  ) {
    return { group: null, error: 'Ya tienes un grupo con ese nombre' };
  }

  const maxOrder = db.muscle_groups
    .filter((g) => g.user_id === userId)
    .reduce((max, g) => Math.max(max, g.sort_order), -1);

  const group: MuscleGroup = {
    id: newId(),
    user_id: userId,
    name: trimmed,
    sort_order: maxOrder + 1,
    created_at: nowIso(),
  };

  await mutate((d) => {
    d.muscle_groups.push(group);
  });

  return { group, error: null };
}

export async function deleteMuscleGroup(userId: string, groupId: string) {
  await mutate((db) => {
    const exerciseIds = db.exercises
      .filter((e) => e.user_id === userId && e.muscle_group === groupId)
      .map((e) => e.id);

    db.template_exercises = db.template_exercises.filter(
      (te) => !exerciseIds.includes(te.exercise_id),
    );
    db.workout_sets = db.workout_sets.filter((ws) => !exerciseIds.includes(ws.exercise_id));
    db.exercises = db.exercises.filter(
      (e) => !(e.user_id === userId && e.muscle_group === groupId),
    );
    db.muscle_groups = db.muscle_groups.filter(
      (g) => !(g.user_id === userId && g.id === groupId),
    );
  });
  return { error: null };
}

export async function listExercisesByDay(userId: string, trainingDay: number): Promise<Exercise[]> {
  const db = await loadDb();
  return db.exercises
    .filter((e) => e.user_id === userId && e.training_day === trainingDay)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateExerciseTrainingDay(
  userId: string,
  exerciseId: string,
  trainingDay: number,
) {
  await mutate((db) => {
    const ex = db.exercises.find((e) => e.id === exerciseId && e.user_id === userId);
    if (ex) ex.training_day = trainingDay;
  });
  return { error: null };
}

export async function addExercise(userId: string, name: string, trainingDay: number) {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'El nombre no puede estar vacío' };
    if (trainingDay < 0 || trainingDay > 6) return { error: 'Día inválido' };

    const db = await loadDb();
    const normalized = trimmed.toLowerCase();
    if (
      db.exercises.some(
        (e) =>
          e.user_id === userId &&
          e.training_day === trainingDay &&
          e.name.trim().toLowerCase() === normalized,
      )
    ) {
      return { error: 'Ya tienes ese ejercicio en este día' };
    }

    const id = newId();
    await mutate((d) => {
      d.exercises.push({
        id,
        user_id: userId,
        name: trimmed,
        muscle_group: null,
        training_day: trainingDay,
        created_at: nowIso(),
      });
    });
    return { error: null, exerciseId: id };
  } catch {
    return { error: 'No se pudo guardar el ejercicio. Prueba recargar la página.' };
  }
}

export async function listTemplateDays(userId: string): Promise<TemplateDay[]> {
  const db = await loadDb();
  return db.template_days.filter((d) => d.user_id === userId).sort((a, b) => a.day_of_week - b.day_of_week);
}

export async function listTemplateExercises(dayIds: string[]): Promise<TemplateExercise[]> {
  if (dayIds.length === 0) return [];
  const db = await loadDb();
  const templateRows = db.template_exercises
    .filter((te) => dayIds.includes(te.template_day_id))
    .sort((a, b) => a.sort_order - b.sort_order);
  const exMap = Object.fromEntries(db.exercises.map((e) => [e.id, e]));
  return templateRows.map((te) => ({ ...te, exercise: exMap[te.exercise_id] }));
}

export async function ensureTemplateDay(userId: string, dayOfWeek: number, name: string) {
  const db = await loadDb();
  const existing = db.template_days.find((d) => d.user_id === userId && d.day_of_week === dayOfWeek);
  if (existing) return existing;

  const day: TemplateDay = {
    id: newId(),
    user_id: userId,
    day_of_week: dayOfWeek,
    name: name.trim() || 'Entrenamiento',
    created_at: nowIso(),
  };
  await mutate((d) => {
    d.template_days.push(day);
  });
  return day;
}

export async function addTemplateExercise(
  dayId: string,
  exerciseId: string,
  sortOrder: number,
  targetSets = 3,
  targetReps = 8,
) {
  try {
    const db = await loadDb();
    const already = db.template_exercises.some(
      (te) => te.template_day_id === dayId && te.exercise_id === exerciseId,
    );
    if (already) return { error: 'Este ejercicio ya está en el día' };

    await mutate((dbSnap) => {
      dbSnap.template_exercises.push({
        id: newId(),
        template_day_id: dayId,
        exercise_id: exerciseId,
        sort_order: sortOrder,
        target_sets: targetSets,
        target_reps: targetReps,
        created_at: nowIso(),
      });
    });
    return { error: null };
  } catch {
    return { error: 'No se pudo añadir el ejercicio a la plantilla' };
  }
}

export async function removeTemplateExercise(id: string) {
  await mutate((db) => {
    db.template_exercises = db.template_exercises.filter((te) => te.id !== id);
  });
}

export async function listWorkoutSessions(userId: string, limit = 50): Promise<WorkoutSession[]> {
  const db = await loadDb();
  return db.workout_sessions
    .filter((s) => s.user_id === userId)
    .sort((a, b) => b.session_date.localeCompare(a.session_date))
    .slice(0, limit)
    .map(mapSession);
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | null> {
  const db = await loadDb();
  const row = db.workout_sessions.find((s) => s.id === id);
  return row ? mapSession(row) : null;
}

export async function getSessionSets(sessionId: string): Promise<WorkoutSet[]> {
  const db = await loadDb();
  const exMap = Object.fromEntries(db.exercises.map((e) => [e.id, e]));
  return db.workout_sets
    .filter((s) => s.session_id === sessionId)
    .sort((a, b) => a.set_number - b.set_number)
    .map((r) => ({
      ...mapSetRow(r),
      exercise: exMap[r.exercise_id],
    }));
}

export async function startWorkoutSession(
  userId: string,
  templateDayId: string | null,
  weekYear: number,
  weekNumber: number,
  sessionDate: string,
) {
  try {
    const id = newId();
    const row: SessionRow = {
      id,
      user_id: userId,
      session_date: sessionDate,
      week_year: weekYear,
      week_number: weekNumber,
      template_day_id: templateDayId,
      notes: null,
      completed: 0,
      created_at: nowIso(),
    };
    await mutate((db) => {
      db.workout_sessions.push(row);
    });
    return { session: mapSession(row), error: null };
  } catch {
    return { session: null, error: 'No se pudo crear la sesión' };
  }
}

export async function saveWorkoutSets(
  sessionId: string,
  sets: Omit<WorkoutSet, 'id' | 'created_at' | 'exercise'>[],
) {
  await mutate((db) => {
    db.workout_sets = db.workout_sets.filter((s) => s.session_id !== sessionId);
    for (const s of sets) {
      db.workout_sets.push({
        id: newId(),
        session_id: s.session_id,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed ? 1 : 0,
        from_template: s.from_template ? 1 : 0,
        created_at: nowIso(),
      });
    }
    const session = db.workout_sessions.find((x) => x.id === sessionId);
    if (session) session.completed = 1;
  });
}

export async function getPastSetsForExercise(userId: string, exerciseId: string, limit = 20): Promise<SetRow[]> {
  const db = await loadDb();
  const sessionIds = new Set(db.workout_sessions.filter((s) => s.user_id === userId).map((s) => s.id));
  return db.workout_sets
    .filter((s) => sessionIds.has(s.session_id) && s.exercise_id === exerciseId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export async function getExerciseProgress(userId: string, exerciseId: string) {
  const db = await loadDb();
  const sessionMap = Object.fromEntries(
    db.workout_sessions.filter((s) => s.user_id === userId).map((s) => [s.id, s]),
  );

  const byWeek: Record<string, number> = {};
  for (const ws of db.workout_sets) {
    if (ws.exercise_id !== exerciseId || ws.completed !== 1) continue;
    const s = sessionMap[ws.session_id];
    if (!s) continue;
    const key = `S${s.week_number} ${s.week_year}`;
    byWeek[key] = Math.max(byWeek[key] ?? 0, ws.weight);
  }

  return Object.entries(byWeek)
    .map(([weekLabel, maxWeight]) => ({ weekLabel, maxWeight }))
    .sort((a, b) => compareWeekLabels(a.weekLabel, b.weekLabel));
}

export async function listUserSessionIds(userId: string): Promise<string[]> {
  const db = await loadDb();
  return db.workout_sessions.filter((s) => s.user_id === userId).map((s) => s.id);
}
