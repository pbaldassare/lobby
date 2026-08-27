import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

/** Schema Postgres dedicato a Lobby sul progetto Supabase condiviso. */
export const LOBBY_DB_SCHEMA = "lobby";

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    db: { schema: LOBBY_DB_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }
  return createClient(url, anon, {
    db: { schema: LOBBY_DB_SCHEMA },
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
