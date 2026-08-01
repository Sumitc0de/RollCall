import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseUrl } from '../lib/supabase';
import { getDeviceId, getAppVersion, getPlatform } from './device';

const LAST_SYNC_STORAGE_KEY = '@rollcall_analytics_last_sync';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const UPSERT_TIMEOUT_MS = 2500;

/**
 * Helper to race a promise against a strict timeout.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Analytics request timed out')), timeoutMs)
    ),
  ]);
}

/**
 * Tracks app open event anonymously:
 * 1. Retrieves or generates anonymous device UUID.
 * 2. Checks if synced within the last 24 hours (optimizing API calls).
 * 3. Upserts device analytics into Supabase `analytics` table with a strict 2.5s timeout.
 * 4. Updates `last_sync` in AsyncStorage on success.
 *
 * Completely non-blocking and silent.
 */
export async function trackAppOpen(): Promise<boolean> {
  try {
    if (!supabaseUrl) return false;

    // 1. Obtain anonymous Device ID
    const deviceId = await getDeviceId();

    // 2. Check 24-hour sync threshold
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_STORAGE_KEY);
    if (lastSync) {
      const lastSyncTime = parseInt(lastSync, 10);
      if (!isNaN(lastSyncTime) && Date.now() - lastSyncTime < TWENTY_FOUR_HOURS_MS) {
        if (__DEV__) {
          console.log('[Analytics] Synced less than 24 hours ago. Skipping request.');
        }
        return true;
      }
    }

    // 3. Prepare payload for Supabase upsert
    const payload = {
      device_id: deviceId,
      last_seen: new Date().toISOString(),
      app_version: getAppVersion(),
      platform: getPlatform(),
    };

    // 4. Upsert into Supabase with a strict 2.5s timeout to avoid hanging startup
    const upsertPromise = (async () => {
      const { error } = await supabase
        .from('analytics')
        .upsert(payload, { onConflict: 'device_id' });
      if (error) throw error;
      return true;
    })();

    await withTimeout(upsertPromise, UPSERT_TIMEOUT_MS);

    // 5. Update last_sync timestamp in AsyncStorage
    await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, Date.now().toString());

    if (__DEV__) {
      console.log('[Analytics] App open tracked successfully:', payload);
    }
    return true;
  } catch (err: any) {
    if (__DEV__) {
      console.log('[Analytics] Skipping app open track:', err?.message ?? err);
    }
    return false;
  }
}
