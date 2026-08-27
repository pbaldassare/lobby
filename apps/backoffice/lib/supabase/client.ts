'use client';

import { createBrowserClient } from '@supabase/ssr';
import { LOBBY_DB_SCHEMA } from '@lobby/shared/supabase';

/** Browser client — anon key + RLS only. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }
  return createBrowserClient(url, anon, {
    db: { schema: LOBBY_DB_SCHEMA },
  });
}
