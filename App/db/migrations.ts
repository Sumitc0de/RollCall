import { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL, CURRENT_SCHEMA_VERSION } from './schema';

async function ensureRequiredColumns(db: SQLiteDatabase): Promise<void> {
  const subjectCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(subjects);');
  if (subjectCols.length > 0 && !subjectCols.some((column) => column.name === 'is_deleted')) {
    await db.execAsync('ALTER TABLE subjects ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;');
  }
  if (subjectCols.length > 0 && !subjectCols.some((column) => column.name === 'type')) {
    await db.execAsync("ALTER TABLE subjects ADD COLUMN type TEXT NOT NULL DEFAULT 'theory';");
  }

  const recordCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lecture_records);');
  if (recordCols.length > 0 && !recordCols.some((column) => column.name === 'updated_at')) {
    await db.execAsync("ALTER TABLE lecture_records ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';");
    await db.execAsync("UPDATE lecture_records SET updated_at = created_at WHERE updated_at = '';");
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion === 0) {
    // Check if tables already exist from legacy init.ts
    const tableCheck = await db.getFirstAsync<{ count: number }>(
      "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='subjects';"
    );

    if (tableCheck && tableCheck.count > 0) {
      // Existing DB: migrate schema safely
      const subjectCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(subjects);");
      if (!subjectCols.some((c) => c.name === 'is_deleted')) {
        await db.execAsync("ALTER TABLE subjects ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;");
      }
      if (!subjectCols.some((c) => c.name === 'type')) {
        await db.execAsync("ALTER TABLE subjects ADD COLUMN type TEXT NOT NULL DEFAULT 'theory';");
      }

      const recordCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(lecture_records);");
      if (!recordCols.some((c) => c.name === 'updated_at')) {
        await db.execAsync("ALTER TABLE lecture_records ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';");
        await db.execAsync("UPDATE lecture_records SET updated_at = created_at WHERE updated_at = '';");
      }

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        INSERT OR IGNORE INTO user_settings (key, value) VALUES ('user_name', 'Sumit');
        INSERT OR IGNORE INTO user_settings (key, value) VALUES ('auto_mark_present', 'false');
        CREATE INDEX IF NOT EXISTS idx_lecture_subject_date ON lecture_records(subject_id, date);
        CREATE INDEX IF NOT EXISTS idx_schedule_subject ON subject_schedule(subject_id);
      `);

      await db.execAsync(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
      return;
    }

    // Fresh install
    await db.execAsync(CREATE_TABLES_SQL);
    await db.execAsync(`
      INSERT OR IGNORE INTO user_settings (key, value) VALUES ('user_name', 'Sumit');
      INSERT OR IGNORE INTO user_settings (key, value) VALUES ('auto_mark_present', 'false');
    `);
    await db.execAsync(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
    return;
  }

  // Version 1 databases were created before subjects.is_deleted was added.
  if (currentVersion < 2) {
    const subjectCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(subjects);');
    if (!subjectCols.some((column) => column.name === 'is_deleted')) {
      await db.execAsync('ALTER TABLE subjects ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;');
    }

    await db.execAsync('PRAGMA user_version = 2;');
  }

  // Version 2 databases may still be missing lecture_records.updated_at.
  if (currentVersion < 3) {
    const recordCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lecture_records);');
    if (!recordCols.some((column) => column.name === 'updated_at')) {
      await db.execAsync("ALTER TABLE lecture_records ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';");
      await db.execAsync("UPDATE lecture_records SET updated_at = created_at WHERE updated_at = '';");
    }

    await db.execAsync('PRAGMA user_version = 3;');
  }

  if (currentVersion < 4) {
    await ensureRequiredColumns(db);
    await db.execAsync('PRAGMA user_version = 4;');
  }

  if (currentVersion < 5) {
    const subjectCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(subjects);');
    if (!subjectCols.some((column) => column.name === 'type')) {
      await db.execAsync("ALTER TABLE subjects ADD COLUMN type TEXT NOT NULL DEFAULT 'theory';");
    }
    await db.execAsync(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
  }

  await ensureRequiredColumns(db);
}
