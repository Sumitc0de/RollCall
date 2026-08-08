import { addDays, format, parseISO } from 'date-fns';
import type { Schedule, Subject } from '../types';

export type ExpectedLectureDay = { date: string; count: number };
export function generateExpectedLectures(subject: Subject, schedule: Schedule[], fromDate: string, toDate: string): ExpectedLectureDay[] {
  const scheduleByDay = new Map(schedule.map((row) => [row.day_of_week, row.lectures_count]));
  const result: ExpectedLectureDay[] = [];
  for (let day = parseISO(fromDate); day <= parseISO(toDate); day = addDays(day, 1)) {
    const count = scheduleByDay.get(day.getDay());
    if (count) result.push({ date: format(day, 'yyyy-MM-dd'), count });
  }
  return result;
}
