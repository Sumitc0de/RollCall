import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_STORAGE_KEY = '@rollcall_device_id';

/**
 * Retrieves the stored anonymous device ID, or generates and persists a new UUID on first launch.
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    if (__DEV__) {
      console.error('[Device] Failed to read/write device ID in AsyncStorage:', error);
    }
    return Crypto.randomUUID();
  }
}

/**
 * Returns current application version string.
 */
export function getAppVersion(): string {
  return Application.nativeApplicationVersion || '1.0.0';
}

/**
 * Returns current operating system platform (e.g. 'android', 'ios').
 */
export function getPlatform(): string {
  return Platform.OS;
}
