import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseUrl, getServiceRoleKey } from '@/lib/env';

/**
 * Service-role client — SERVER ONLY.
 * Still enforce staff + venue scope in application code before privileged writes.
 */
export function createAdminClient() {
  return createClient(getPublicSupabaseUrl(), getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
