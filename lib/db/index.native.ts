import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('gym-tracker.db');
      await initSchema(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  await getDb();
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      default_weight_increment REAL NOT NULL DEFAULT 2.5,
      last_seen_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      muscle_group TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, name)
    );

    CREATE TABLE IF NOT EXISTS template_days (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      name TEXT NOT NULL DEFAULT 'Entrenamiento',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, day_of_week)
    );

    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      template_day_id TEXT NOT NULL REFERENCES template_days(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      target_sets INTEGER NOT NULL DEFAULT 3,
      target_reps INTEGER NOT NULL DEFAULT 8,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL DEFAULT (date('now')),
      week_year INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      template_day_id TEXT REFERENCES template_days(id) ON DELETE SET NULL,
      notes TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL CHECK (set_number >= 1),
      weight REAL NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 1,
      from_template INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, session_date DESC);
    CREATE INDEX IF NOT EXISTS idx_sets_session ON workout_sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_sets_exercise ON workout_sets(exercise_id);

    CREATE TABLE IF NOT EXISTS muscle_groups (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, name)
    );

    CREATE INDEX IF NOT EXISTS idx_muscle_groups_user ON muscle_groups(user_id);
  `);
  await migrateProfilesEmailToUsername(db);
  await migrateAddRestSeconds(db);
  await migrateAddWeightUnit(db);
  await migrateAddMuscleGroups(db);
  await migrateAddTrainingDay(db);
}

async function migrateAddTrainingDay(db: SQLite.SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(exercises)');
  if (!columns.some((c) => c.name === 'training_day')) {
    await db.execAsync('ALTER TABLE exercises ADD COLUMN training_day INTEGER');
  }
}

async function migrateAddMuscleGroups(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS muscle_groups (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, name)
    );
    CREATE INDEX IF NOT EXISTS idx_muscle_groups_user ON muscle_groups(user_id);
  `);
}

async function migrateAddWeightUnit(db: SQLite.SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(profiles)');
  if (!columns.some((c) => c.name === 'weight_unit')) {
    await db.execAsync(
      "ALTER TABLE profiles ADD COLUMN weight_unit TEXT NOT NULL DEFAULT 'lb'",
    );
  }
  await db.runAsync(
    "UPDATE profiles SET default_weight_increment = 10 WHERE default_weight_increment = 2.5 AND weight_unit = 'lb'",
  );
}

async function migrateAddRestSeconds(db: SQLite.SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(profiles)');
  if (!columns.some((c) => c.name === 'default_rest_seconds')) {
    await db.execAsync(
      'ALTER TABLE profiles ADD COLUMN default_rest_seconds INTEGER NOT NULL DEFAULT 90',
    );
  }
}

async function migrateProfilesEmailToUsername(db: SQLite.SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(profiles)');
  if (columns.some((c) => c.name === 'email') && !columns.some((c) => c.name === 'username')) {
    await db.execAsync('ALTER TABLE profiles RENAME COLUMN email TO username');
  }
}

export { newId, nowIso } from '@/lib/db/shared';
