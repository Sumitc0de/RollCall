import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('attendance.db');
  await dbInstance.execAsync('PRAGMA journal_mode = WAL;');
  await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

export async function resetDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }

  await SQLite.deleteDatabaseAsync('attendance.db');
}
