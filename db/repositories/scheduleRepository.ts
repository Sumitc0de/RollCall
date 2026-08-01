import { getDb } from '../client';
import { Schedule } from '../../types';
import { randomUUID } from 'expo-crypto';

export const scheduleRepository = {
  async getBySubject(subjectId: string): Promise<Schedule[]> {
    const db = await getDb();
    return db.getAllAsync<Schedule>(
      'SELECT * FROM subject_schedule WHERE subject_id = ? ORDER BY day_of_week ASC',
      [subjectId]
    );
  },

  async getAllSchedules(): Promise<Schedule[]> {
    const db = await getDb();
    return db.getAllAsync<Schedule>('SELECT * FROM subject_schedule ORDER BY subject_id, day_of_week');
  },

  async replaceForSubject(
    subjectId: string,
    scheduleEntries: { dayOfWeek: number; lecturesCount: number }[]
  ): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync('DELETE FROM subject_schedule WHERE subject_id = ?', [subjectId]);
      for (const item of scheduleEntries) {
        await tx.runAsync(
          'INSERT INTO subject_schedule (id, subject_id, day_of_week, lectures_count) VALUES (?, ?, ?, ?)',
          [randomUUID(), subjectId, item.dayOfWeek, item.lecturesCount]
        );
      }
    });
  },
};
