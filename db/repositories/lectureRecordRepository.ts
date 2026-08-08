import { getDb } from '../client';
import { LectureRecord, LectureStatus, Attendance, Subject, Schedule } from '../../types';
import { randomUUID } from 'expo-crypto';
import { format } from 'date-fns';
import { attendanceFromCounts } from '../../utils/attendanceMath';
import { generateExpectedLectures } from '../../utils/lectureGenerator';
import { userSettingsRepository } from './userSettingsRepository';

const todayStr = () => format(new Date(), 'yyyy-MM-dd');
const nowIso = () => new Date().toISOString();

export const lectureRecordRepository = {
  async create(subjectId: string, date: string, status: LectureStatus = 'unmarked'): Promise<LectureRecord> {
    const db = await getDb();
    const id = randomUUID();
    const now = nowIso();
    const record: LectureRecord = {
      id,
      subject_id: subjectId,
      date,
      status,
      created_at: now,
      updated_at: now,
    };
    await db.runAsync(
      `INSERT INTO lecture_records (id, subject_id, date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [record.id, record.subject_id, record.date, record.status, record.created_at, record.updated_at ?? record.created_at]
    );
    return record;
  },

  async updateStatus(id: string, status: LectureStatus): Promise<void> {
    const db = await getDb();
    const now = nowIso();
    await db.runAsync(
      `UPDATE lecture_records SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, id]
    );
  },

  async getBySubject(subjectId: string): Promise<LectureRecord[]> {
    const db = await getDb();
    return db.getAllAsync<LectureRecord>(
      `SELECT * FROM lecture_records WHERE subject_id = ? ORDER BY date ASC, created_at ASC`,
      [subjectId]
    );
  },

  async getHistory(subjectId: string): Promise<LectureRecord[]> {
    const db = await getDb();
    return db.getAllAsync<LectureRecord>(
      `SELECT * FROM lecture_records WHERE subject_id = ? ORDER BY date DESC, created_at DESC`,
      [subjectId]
    );
  },

  async getUnmarked(): Promise<LectureRecord[]> {
    const db = await getDb();
    return db.getAllAsync<LectureRecord>(
      `SELECT l.*, s.name AS subject_name 
       FROM lecture_records l 
       JOIN subjects s ON s.id = l.subject_id 
       WHERE s.is_deleted = 0 AND l.status = 'unmarked' 
       ORDER BY l.date ASC, s.name ASC`
    );
  },

  async getRecordsForDate(date: string): Promise<LectureRecord[]> {
    const db = await getDb();
    return db.getAllAsync<LectureRecord>(
      `SELECT 
        l.*, 
        s.name AS subject_name, 
        s.type AS subject_type,
        s.target_percent,
        COALESCE(SUM(CASE WHEN l2.status = 'present' THEN 1 ELSE 0 END), 0) AS subject_present,
        COALESCE(SUM(CASE WHEN l2.status IN ('present','absent') THEN 1 ELSE 0 END), 0) AS subject_total
      FROM lecture_records l
      JOIN subjects s ON s.id = l.subject_id
      LEFT JOIN lecture_records l2 ON l2.subject_id = s.id
      WHERE s.is_deleted = 0 AND l.date = ?
      GROUP BY l.id
      ORDER BY s.name ASC, l.created_at ASC`,
      [date]
    );
  },

  async getAttendance(subjectId: string): Promise<Attendance> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ present: number; total: number }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) as present,
        COALESCE(SUM(CASE WHEN status IN ('present','absent') THEN 1 ELSE 0 END), 0) as total
       FROM lecture_records WHERE subject_id = ?`,
      [subjectId]
    );
    const present = row?.present ?? 0;
    const total = row?.total ?? 0;
    return attendanceFromCounts(present, total);
  },

  async getComputedStats(subjectId: string): Promise<{ total: number; present: number; absent: number; cancelled: number; percent: number | null }> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ total: number; present: number; absent: number; cancelled: number }>(
      `SELECT
        COUNT(CASE WHEN status IN ('present','absent') THEN 1 END) as total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
       FROM lecture_records WHERE subject_id = ?`,
      [subjectId]
    );
    const total = row?.total ?? 0;
    const present = row?.present ?? 0;
    const absent = row?.absent ?? 0;
    const cancelled = row?.cancelled ?? 0;
    return {
      total,
      present,
      absent,
      cancelled,
      percent: total === 0 ? null : (present / total) * 100,
    };
  },

  async markDatePresent(date: string): Promise<number> {
    const db = await getDb();
    const now = nowIso();
    const result = await db.runAsync(
      `UPDATE lecture_records SET status = 'present', updated_at = ? WHERE date = ? AND status = 'unmarked'`,
      [now, date]
    );
    return result.changes;
  },

  async generateForSubject(subject: Subject): Promise<void> {
    const db = await getDb();
    const schedule = await db.getAllAsync<Schedule>(
      'SELECT * FROM subject_schedule WHERE subject_id = ? ORDER BY day_of_week',
      [subject.id]
    );
    const expected = generateExpectedLectures(subject, schedule, subject.semester_start_date, todayStr());
    const autoMark = await userSettingsRepository.getSetting('auto_mark_present', 'false');
    const defaultStatus = autoMark === 'true' ? 'present' : 'unmarked';
    const now = nowIso();

    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const day of expected) {
        const existing = await tx.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM lecture_records WHERE subject_id = ? AND date = ?',
          [subject.id, day.date]
        );
        const existingCount = existing?.count ?? 0;
        for (let i = existingCount; i < day.count; i++) {
          await tx.runAsync(
            'INSERT INTO lecture_records (id, subject_id, date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [randomUUID(), subject.id, day.date, defaultStatus, now, now]
          );
        }
      }
    });
  },

  async generateAll(): Promise<void> {
    const db = await getDb();
    const subjects = await db.getAllAsync<Subject>('SELECT * FROM subjects WHERE is_deleted = 0');
    for (const subject of subjects) {
      await this.generateForSubject(subject);
    }
    await this.autoMarkPastLecturesAsPresent();
  },

  async addExtraLectures(subjectId: string, dates: string[]): Promise<void> {
    if (dates.length === 0) return;
    const db = await getDb();
    const autoMark = await userSettingsRepository.getSetting('auto_mark_present', 'false');
    const today = todayStr();
    const now = nowIso();

    for (const date of dates) {
      const status = (autoMark === 'true' && date <= today) ? 'present' : 'unmarked';
      await db.runAsync(
        'INSERT INTO lecture_records (id, subject_id, date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [randomUUID(), subjectId, date, status, now, now]
      );
    }
  },

  async autoMarkPastLecturesAsPresent(): Promise<void> {
    const db = await getDb();
    const autoMark = await userSettingsRepository.getSetting('auto_mark_present', 'false');
    if (autoMark === 'true') {
      const today = todayStr();
      const now = nowIso();
      await db.runAsync(
        "UPDATE lecture_records SET status = 'present', updated_at = ? WHERE date <= ? AND status = 'unmarked'",
        [now, today]
      );
    }
  },

  async deleteRecord(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM lecture_records WHERE id = ?', [id]);
  },

  async deleteRecordsForSubject(subjectId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM lecture_records WHERE subject_id = ?', [subjectId]);
  },

  async getAll(): Promise<LectureRecord[]> {
    const db = await getDb();
    return db.getAllAsync<LectureRecord>('SELECT * FROM lecture_records ORDER BY date ASC, created_at ASC');
  },
};
