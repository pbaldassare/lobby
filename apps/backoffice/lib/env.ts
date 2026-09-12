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
      'Missing SUPABASE_SERVICE_ROLE_KEY (server-only). Never use NEXT_PUBLIC_ for this.',
    );
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SERVICE_ROLE must not be exposed as NEXT_PUBLIC_*. Remove NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY.',
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
