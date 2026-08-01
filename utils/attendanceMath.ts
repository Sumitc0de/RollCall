import type { Attendance } from '../types';

export const attendancePercent = (present: number, total: number) => total ? (present / total) * 100 : null;
export const safeSkips = (present: number, total: number, targetPercent: number) =>
  Math.max(0, Math.floor((present - (targetPercent / 100) * total) / (targetPercent / 100)));
export const classesNeededToRecover = (present: number, total: number, targetPercent: number) => {
  const target = targetPercent / 100;
  if (!total || present / total >= target) return 0;
  return Math.max(0, Math.ceil((target * total - present) / (1 - target)));
};
export const attendanceFromCounts = (present: number, total: number): Attendance => ({ present, total, percent: attendancePercent(present, total) });
