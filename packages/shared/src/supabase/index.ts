/**
 * Shared Supabase helpers — no service_role here (never in shared client bundle).
 * App-specific SecureStore / cookie adapters are passed in by each app.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const LOBBY_SUPABASE_URL = 'https://kxgaqnksylntokyrpaxp.supabase.co';

/** Edge Function names used by mobile + backoffice. */
export const EDGE_FUNCTIONS = {
  issueSeal: 'issue-seal',
  computeMatches: 'compute-matches',
  sendSignal: 'send-signal',
} as const;

export type EdgeFunctionName = (typeof EDGE_FUNCTIONS)[keyof typeof EDGE_FUNCTIONS];

/** Deep-link / QR join URL for a venue room (mobile + poster). */
export function buildRoomJoinUrl(params: {
  venueId: string;
  roomId: string;
  /** Optional https origin for universal links; defaults to lobby scheme */
  webOrigin?: string;
}): string {
  const path = `/join?venue=${encodeURIComponent(params.venueId)}&room=${encodeURIComponent(params.roomId)}`;
  if (params.webOrigin) {
    return `${params.webOrigin.replace(/\/$/, '')}${path}`;
  }
  return `lobby://join?venue=${encodeURIComponent(params.venueId)}&room=${encodeURIComponent(params.roomId)}`;
}

export type CreateLobbyClientOptions = {
  url: string;
  anonKey: string;
  authStorage?: {
    getItem: (key: string) => Promise<string | null> | string | null;
    setItem: (key: string, value: string) => Promise<void> | void;
    removeItem: (key: string) => Promise<void> | void;
  };
};

/**
 * Create an anon-key Supabase client for Lobby apps.
 * Privileged ops → Edge Functions (`EDGE_FUNCTIONS`). Never pass service_role.
 */
export function createLobbySupabaseClient(
  options: CreateLobbyClientOptions,
): SupabaseClient {
  const { url, anonKey, authStorage } = options;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase URL or anon key. Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (mobile) or public env (web).',
    );
  }

  if (anonKey.includes('service_role')) {
    throw new Error('service_role key must never be used in client bundles.');
  }

  return createClient(url, anonKey, {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export type { SupabaseClient };
