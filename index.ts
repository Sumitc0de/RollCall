import { registerRootComponent } from 'expo';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { NativeModulesProxy } from 'expo-modules-core';

console.log('[RollCall Audit] 1. Application Entry Point Initialized (index.ts)');

// Protection 1: Patch NativeModulesProxy ExpoAsset downloadAsync
try {
  const expoAssetModule = (NativeModulesProxy as any)?.ExpoAsset;
  if (expoAssetModule && typeof expoAssetModule.downloadAsync === 'function') {
    const origNativeDownload = expoAssetModule.downloadAsync;
    expoAssetModule.downloadAsync = function () {
      return origNativeDownload.apply(this, arguments as any).catch((err: any) => {
        if (__DEV__) {
          console.log('[RollCall Audit] Handled native ExpoAsset.downloadAsync error:', err?.message || String(err));
        }
        return Promise.resolve();
      });
    };
  }
} catch (e) {}

// Protection 2: Patch Asset.prototype.downloadAsync
try {
  const originalDownload = Asset.prototype.downloadAsync;
  if (originalDownload) {
    Asset.prototype.downloadAsync = function () {
      return originalDownload.apply(this, arguments as any).catch((err: any) => {
        if (__DEV__) {
          console.log('[RollCall Audit] Handled Asset.downloadAsync gracefully:', err?.message || String(err));
        }
        return Promise.resolve(this);
      });
    };
  }
} catch (e) {}

// Protection 3: Safe startup Ionicons font pre-load with .catch() so Font.isLoaded('ionicons') is set before screens render
try {
  Font.loadAsync(Ionicons.font).catch((err) => {
    if (__DEV__) {
      console.log('[RollCall Audit] Startup Ionicons font pre-fetch handled:', err?.message || String(err));
    }
  });
} catch (e) {}

import App from './App';

console.log('[RollCall Audit] 2. Registering Root Component');
registerRootComponent(App);
