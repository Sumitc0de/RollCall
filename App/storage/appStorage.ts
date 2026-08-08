import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppData } from '../types';

const STORAGE_KEY = 'attendance_app_data';

const DEFAULT_DATA: AppData = {
  subjects: [],
  lectureRecords: [],
  settings: { userName: 'Student', autoMarkPresent: false },
  lastGeneratedDate: '',
};

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      subjects: parsed.subjects ?? [],
      lectureRecords: parsed.lectureRecords ?? [],
      settings: {
        userName: parsed.settings?.userName ?? 'Student',
        autoMarkPresent: parsed.settings?.autoMarkPresent ?? false,
      },
      lastGeneratedDate: parsed.lastGeneratedDate ?? '',
    };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
