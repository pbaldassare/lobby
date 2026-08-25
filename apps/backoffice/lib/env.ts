/** Env helpers. SERVICE_ROLE must never use NEXT_PUBLIC_*. */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function getPublicSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    'https://kxgaqnksylntokyrpaxp.supabase.co'
  );
}

export function getPublicAnonKey(): string {
  return required(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}
