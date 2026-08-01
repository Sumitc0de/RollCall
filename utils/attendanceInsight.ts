import { classesNeededToRecover, safeSkips } from './attendanceMath';

export type AttendanceInsight = {
  tone: 'neutral' | 'danger' | 'warning' | 'safe';
  title: string;
  message: string;
};

export function getAttendanceInsight(present: number, total: number, targetPercent: number): AttendanceInsight {
  if (total === 0) return { tone: 'neutral', title: 'No attendance data yet', message: 'Mark your first lecture to start tracking this subject.' };
  const percent = (present / total) * 100;
  if (percent < targetPercent) {
    const needed = classesNeededToRecover(present, total, targetPercent);
    return { tone: 'danger', title: 'Attendance alert', message: `${percent.toFixed(0)}% is below your ${targetPercent}% target. Attend the next ${needed} class${needed === 1 ? '' : 'es'} to recover.` };
  }
  const skips = safeSkips(present, total, targetPercent);
  if (skips === 0) return { tone: 'warning', title: 'Right on target', message: `${percent.toFixed(0)}% meets your ${targetPercent}% target. Keep attending the next class.` };
  return { tone: 'safe', title: 'You are on track', message: `${percent.toFixed(0)}% attendance. You can safely take ${skips} break${skips === 1 ? '' : 's'} and stay above ${targetPercent}%.` };
}
