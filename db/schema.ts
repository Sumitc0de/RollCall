export const CURRENT_SCHEMA_VERSION = 4;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  target_percent INTEGER NOT NULL DEFAULT 75,
  semester_start_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subject_schedule (
  id TEXT PRIMARY KEY NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  lectures_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lecture_records (
  id TEXT PRIMARY KEY NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('present','absent','cancelled','unmarked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS user_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lecture_subject_date ON lecture_records(subject_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_subject ON subject_schedule(subject_id);
`;
