import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function formatSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return 'https://dnjizhszpoqwkafnkymu.supabase.co';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  if (rawUrl.includes('.')) {
    return `https://${rawUrl}`;
  }
  // Fallback to standard Supabase host format for project ref
  return `https://${rawUrl}.supabase.co`;
}

export const supabaseUrl = formatSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
}

export const supabase = {
  from: (table: string) => getSupabase().from(table),
};
