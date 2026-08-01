import { getDb } from '../client';

export const userSettingsRepository = {
  async getSetting(key: string, defaultValue: string): Promise<string> {
    try {
      const db = await getDb();
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM user_settings WHERE key = ?',
        [key]
      );
      return row?.value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async setSetting(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  },
};
