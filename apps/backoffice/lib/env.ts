/** Env helpers. SERVICE_ROLE must never use NEXT_PUBLIC_*. */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function getPublicSupabaseUrl(): string {
  return required(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://mjzjracjadlybvdttgto.supabase.co',
  );
}

export function getPublicAnonKey(): string {
  return required(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qempyYWNqYWRseWJ2ZHR0Z3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTI0NTIsImV4cCI6MjA5NzcyODQ1Mn0.BH1NHibXiMYLUt5GUah40C_sMwzGdZ5q7X7eBNEAzeo',
  );
}

/** Server-only. Never call from client components. */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      'Manca SUPABASE_SERVICE_ROLE_KEY (solo server). Non usare mai NEXT_PUBLIC_ per questa chiave.',
    );
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SERVICE_ROLE non deve essere esposta come NEXT_PUBLIC_*. Rimuovi NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return key;
}

export function getAppOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.CF_PAGES_URL) {
    return process.env.CF_PAGES_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

/** Origine dell'app membro (PWA) per i QR all'ingresso — non il back-office. */
export function getMemberWebOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_MEMBER_APP_URL ||
    process.env.EXPO_PUBLIC_WEB_ORIGIN ||
    'https://lobby-app.pages.dev';
  return raw.replace(/\/$/, '');
}
