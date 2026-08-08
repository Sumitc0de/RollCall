/**
 * Lightweight native fetch-based Supabase REST client.
 * Bypasses heavy @supabase/supabase-js node module dependencies that cause Metro 99% bundling hangs.
 */

function formatSupabaseUrl(rawUrl?: string): string {
  const url = rawUrl || 'https://dnjizhszpoqwkafnkymu.supabase.co';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.includes('.')) {
    return `https://${url}`;
  }
  return `https://${url}.supabase.co`;
}

export const supabaseUrl = formatSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';


export const supabase = {
  from(table: string) {
    return {
      async upsert(payload: Record<string, any> | Record<string, any>[], options?: { onConflict?: string }) {
        if (!supabaseUrl || !supabaseAnonKey) {
          return { data: null, error: new Error('Supabase credentials missing') };
        }

        try {
          const endpoint = `${supabaseUrl}/rest/v1/${table}`;
          const preferHeader = options?.onConflict
            ? `resolution=merge-duplicates,return=minimal,on_conflict=${options.onConflict}`
            : 'resolution=merge-duplicates,return=minimal';

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'Prefer': preferHeader,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return { data: null, error: new Error(`Supabase REST HTTP ${response.status}: ${errorText}`) };
          }

          return { data: true, error: null };
        } catch (err: any) {
          return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
        }
      },
    };
  },
};
