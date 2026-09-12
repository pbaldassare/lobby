/**
 * Public Expo env only. Never read SERVICE_ROLE here.
 * Fallbacks are the shared project's publishable (RLS-gated) anon key —
 * the same values already inlined for the backoffice Pages build.
 */
const FALLBACK_SUPABASE_URL = 'https://mjzjracjadlybvdttgto.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qempyYWNqYWRseWJ2ZHR0Z3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTI0NTIsImV4cCI6MjA5NzcyODQ1Mn0.BH1NHibXiMYLUt5GUah40C_sMwzGdZ5q7X7eBNEAzeo';

export type MobileEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  webOrigin: string;
};

function readPublic(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || value.includes('YOUR_PROJECT_REF') || value === 'your_anon_key') {
    return fallback;
  }
  return value;
}

export function getMobileEnv(): MobileEnv {
  return {
    supabaseUrl: readPublic('EXPO_PUBLIC_SUPABASE_URL', FALLBACK_SUPABASE_URL),
    supabaseAnonKey: readPublic('EXPO_PUBLIC_SUPABASE_ANON_KEY', FALLBACK_SUPABASE_ANON_KEY),
    webOrigin: (process.env.EXPO_PUBLIC_WEB_ORIGIN ?? '').replace(/\/$/, ''),
  };
}

export function isEnvConfigured(): boolean {
  if (process.env.EXPO_PUBLIC_DEMO === '1') return false;
  const { supabaseUrl, supabaseAnonKey } = getMobileEnv();
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    supabaseAnonKey !== 'your_anon_key' &&
    !supabaseAnonKey.includes('placeholder')
  );
}

/** HTTPS origin of the member PWA (QR / join links). Runtime window wins. */
export function getWebOrigin(): string {
  const fromEnv = getMobileEnv().webOrigin;
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}
