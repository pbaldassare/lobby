/**
 * Public Expo env only. Never read SERVICE_ROLE here.
 */
export type MobileEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function getMobileEnv(): MobileEnv {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return { supabaseUrl, supabaseAnonKey };
}

export function isEnvConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getMobileEnv();
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    supabaseAnonKey !== 'your_anon_key'
  );
}
