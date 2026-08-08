export type LectureStatus = 'present' | 'absent' | 'cancelled' | 'unmarked';

export type SubjectType = 'theory' | 'lab';

export interface Subject {
  id: string;
  name: string;
  type?: SubjectType;
  target_percent: number;
  semester_start_date: string;
  created_at: string;
  is_deleted?: number;
}

export interface Schedule {
  id: string;
  subject_id: string;
  day_of_week: number;
  lectures_count: number;
}

export interface SubjectSummary extends Subject {
  present: number;
  total: number;
}

export interface LectureRecord {
  id: string;
  subject_id: string;
  date: string;
  status: LectureStatus;
  created_at: string;
  updated_at?: string;
  subject_name?: string;
  subject_type?: SubjectType;
  target_percent?: number;
  subject_present?: number;
  subject_total?: number;
}

export interface UserSettings {
  userName: string;
  autoMarkPresent: boolean;
}

export interface Attendance {
  present: number;
  total: number;
  percent: number | null;
}

export interface SubjectStats {
  total: number;
  present: number;
  absent: number;
  cancelled: number;
  percent: number | null;
}

export interface AppData {
  subjects: Subject[];
  lectureRecords: LectureRecord[];
  settings: UserSettings;
  lastGeneratedDate: string;
}
