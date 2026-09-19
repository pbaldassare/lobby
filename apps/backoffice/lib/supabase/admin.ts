import { createClient } from '@supabase/supabase-js';
import { LOBBY_DB_SCHEMA } from '@lobby/shared/supabase';
import { getPublicSupabaseUrl, getServiceRoleKey } from '@/lib/env';

/**
 * Service-role client — SERVER ONLY.
 * Still enforce staff + venue scope in application code before privileged writes.
 */
export function createAdminClient() {
  return createClient(getPublicSupabaseUrl(), getServiceRoleKey(), {
    db: { schema: LOBBY_DB_SCHEMA },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Null when SERVICE_ROLE is not configured (local/dev). Never throw at import. */
export function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}
