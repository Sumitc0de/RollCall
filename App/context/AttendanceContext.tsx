import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { lectureRecordRepository, userSettingsRepository } from '../db';

type AttendanceContextValue = {
  refreshKey: number;
  userName: string;
  autoMarkPresent: boolean;
  setUserName: (name: string) => Promise<void>;
  setAutoMarkPresent: (enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [userName, setUserNameState] = useState('Sumit');
  const [autoMarkPresent, setAutoMarkState] = useState(false);

  const loadSettings = useCallback(async () => {
    const name = await userSettingsRepository.getSetting('user_name', 'Sumit');
    const autoMark = await userSettingsRepository.getSetting('auto_mark_present', 'false');
    setUserNameState(name);
    setAutoMarkState(autoMark === 'true');
  }, []);

  const refresh = useCallback(async () => {
    await lectureRecordRepository.generateAll();
    await loadSettings();
    setRefreshKey((key) => key + 1);
  }, [loadSettings]);

  const setUserName = async (name: string) => {
    const trimmed = name.trim() || 'Sumit';
    await userSettingsRepository.setSetting('user_name', trimmed);
    setUserNameState(trimmed);
    setRefreshKey((k) => k + 1);
  };

  const setAutoMarkPresent = async (enabled: boolean) => {
    const val = enabled ? 'true' : 'false';
    await userSettingsRepository.setSetting('auto_mark_present', val);
    setAutoMarkState(enabled);
    if (enabled) {
      await lectureRecordRepository.autoMarkPastLecturesAsPresent();
    }
    await refresh();
  };

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <AttendanceContext.Provider
      value={{
        refreshKey,
        userName,
        autoMarkPresent,
        setUserName,
        setAutoMarkPresent,
        refresh,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const value = useContext(AttendanceContext);
  if (!value) throw new Error('AttendanceProvider is missing');
  return value;
}
