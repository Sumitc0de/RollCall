import { getDb } from '../client';
import { Subject, SubjectSummary } from '../../types';
import { randomUUID } from 'expo-crypto';
import { scheduleRepository } from './scheduleRepository';
import { lectureRecordRepository } from './lectureRecordRepository';

const nowIso = () => new Date().toISOString();

export const subjectRepository = {
  async getSummaries(): Promise<SubjectSummary[]> {
    const db = await getDb();
    return db.getAllAsync<SubjectSummary>(`
      SELECT 
        s.*, 
        COALESCE(SUM(CASE WHEN l.status = 'present' THEN 1 ELSE 0 END), 0) AS present, 
        COALESCE(SUM(CASE WHEN l.status IN ('present','absent') THEN 1 ELSE 0 END), 0) AS total 
      FROM subjects s 
      LEFT JOIN lecture_records l ON l.subject_id = s.id 
      WHERE s.is_deleted = 0 
      GROUP BY s.id 
      ORDER BY s.created_at DESC
    `);
  },

  async getAll(): Promise<Subject[]> {
    const db = await getDb();
    return db.getAllAsync<Subject>('SELECT * FROM subjects WHERE is_deleted = 0 ORDER BY created_at DESC');
  },

  async getById(id: string): Promise<Subject | null> {
    const db = await getDb();
    return db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ? AND is_deleted = 0', [id]);
  },

  async createWithSchedule(
    values: Omit<Subject, 'id' | 'created_at'>,
    schedule: { day: number; count: number }[],
    extraLectureDates: string[] = []
  ): Promise<Subject> {
    const db = await getDb();
    const subjectId = randomUUID();
    const createdAt = nowIso();
    const subject: Subject = {
      id: subjectId,
      name: values.name,
      target_percent: values.target_percent,
      semester_start_date: values.semester_start_date,
      created_at: createdAt,
      is_deleted: 0,
    };

    // Multi-step write wrapped in a transaction
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        'INSERT INTO subjects (id, name, target_percent, semester_start_date, created_at, is_deleted) VALUES (?, ?, ?, ?, ?, 0)',
        [subject.id, subject.name, subject.target_percent, subject.semester_start_date, subject.created_at]
      );
      for (const item of schedule) {
        await tx.runAsync(
          'INSERT INTO subject_schedule (id, subject_id, day_of_week, lectures_count) VALUES (?, ?, ?, ?)',
          [randomUUID(), subject.id, item.day, item.count]
        );
      }
    });

    await lectureRecordRepository.generateForSubject(subject);
    await lectureRecordRepository.addExtraLectures(subject.id, extraLectureDates);
    await lectureRecordRepository.autoMarkPastLecturesAsPresent();
    return subject;
  },

  async updateWithSchedule(
    subjectId: string,
    values: Pick<Subject, 'name' | 'target_percent' | 'semester_start_date'>,
    schedule: { day: number; count: number }[],
    extraLectureDates: string[] = []
  ): Promise<void> {
    const db = await getDb();

    // Multi-step write wrapped in a transaction
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        'UPDATE subjects SET name = ?, target_percent = ?, semester_start_date = ? WHERE id = ?',
        [values.name, values.target_percent, values.semester_start_date, subjectId]
      );
      await tx.runAsync('DELETE FROM subject_schedule WHERE subject_id = ?', [subjectId]);
      for (const item of schedule) {
        await tx.runAsync(
          'INSERT INTO subject_schedule (id, subject_id, day_of_week, lectures_count) VALUES (?, ?, ?, ?)',
          [randomUUID(), subjectId, item.day, item.count]
        );
      }
    });

    const subject = await this.getById(subjectId);
    if (subject) {
      await lectureRecordRepository.generateForSubject(subject);
    }
    await lectureRecordRepository.addExtraLectures(subjectId, extraLectureDates);
    await lectureRecordRepository.autoMarkPastLecturesAsPresent();
  },

  async updateName(id: string, name: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE subjects SET name = ? WHERE id = ?', [name, id]);
  },

  async updateTarget(id: string, target: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE subjects SET target_percent = ? WHERE id = ?', [target, id]);
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE subjects SET is_deleted = 1 WHERE id = ?', [id]);
  },

  async hardDelete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM subjects WHERE id = ?', [id]);
  },
};
