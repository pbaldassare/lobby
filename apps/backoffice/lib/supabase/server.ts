import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicAnonKey, getPublicSupabaseUrl } from '@/lib/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Server client with user session (anon + cookies). RLS applies. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(getPublicSupabaseUrl(), getPublicAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component — middleware refreshes the session.
        }
      },
    },
  });
}
