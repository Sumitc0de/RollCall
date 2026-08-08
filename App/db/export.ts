import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from './client';

export async function exportAllDataToJson(): Promise<string> {
  const db = await getDb();
  const subjects = await db.getAllAsync('SELECT * FROM subjects WHERE is_deleted = 0');
  const schedule = await db.getAllAsync('SELECT * FROM subject_schedule');
  const records = await db.getAllAsync('SELECT * FROM lecture_records');
  const settings = await db.getAllAsync('SELECT * FROM user_settings');

  const payload = JSON.stringify(
    {
      subjects,
      schedule,
      records,
      settings,
      exported_at: new Date().toISOString(),
    },
    null,
    2
  );

  const file = new File(Paths.document, 'attendance-backup.json');
  await file.write(payload);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Attendance Data',
    });
  }

  return file.uri;
}
