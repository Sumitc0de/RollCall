import { useCallback } from 'react';

export type AnalyticsEvent =
  | 'app_opened'
  | 'subject_added'
  | 'subject_deleted'
  | 'attendance_marked'
  | 'attendance_bulk_marked'
  | 'subject_detail_viewed'
  | 'defaulter_warning_shown';

type AnalyticsProperties = Record<string, string | number | boolean | null>;

export function useAnalytics() {
  const track = useCallback(
    (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
      if (__DEV__) {
        console.log(`[Analytics] ${event}`, properties ?? {});
      }
    },
    []
  );

  return { track };
}
