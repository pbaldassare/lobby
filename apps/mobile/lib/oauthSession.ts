import { oauthCodeFromUrl, oauthErrorFromUrl, oauthTokensFromUrl } from './oauth';
import { getSupabase } from './supabase';

const inflight = new Map<string, Promise<{ error: string | null; skipped?: boolean }>>();

/**
 * Completes a native OAuth return (`lobby://auth/callback?...`).
 * Dedupes PKCE exchanges when both WebBrowser and the callback route see the URL.
 */
export function completeNativeOAuthRedirect(
  raw: string,
): Promise<{ error: string | null; skipped?: boolean }> {
  const denied = oauthErrorFromUrl(raw);
  if (denied === 'canceled') return Promise.resolve({ error: null, skipped: true });
  if (denied) return Promise.resolve({ error: denied });

  const code = oauthCodeFromUrl(raw);
  if (code) {
    const existing = inflight.get(code);
    if (existing) return existing;
    const pending = getSupabase()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => ({ error: error?.message ?? null }));
    inflight.set(code, pending);
    return pending;
  }

  const tokens = oauthTokensFromUrl(raw);
  if (tokens) {
    return getSupabase()
      .auth.setSession(tokens)
      .then(({ error }) => ({ error: error?.message ?? null }));
  }

  return Promise.resolve({ error: 'Il provider non ha restituito una sessione.' });
}
