import * as AppleAuthentication from 'expo-apple-authentication';

import { getSupabase } from './supabase';

function appleError(e: unknown): 'canceled' | { error: string } {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const code = String((e as { code: string }).code);
    if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') return 'canceled';
  }
  if (e instanceof Error) return { error: e.message };
  return { error: 'Accesso con Apple interrotto.' };
}

function displayNameFromApple(
  credential: AppleAuthentication.AppleAuthenticationCredential,
): string | null {
  const given = credential.fullName?.givenName?.trim();
  const family = credential.fullName?.familyName?.trim();
  const parts = [given, family].filter((p): p is string => Boolean(p));
  return parts.length ? parts.join(' ') : null;
}

async function saveAppleDisplayName(name: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const userId = (await getSupabase().auth.getUser()).data.user?.id;
    if (userId) {
      const { data } = await getSupabase()
        .from('profiles')
        .update({ display_name: name })
        .eq('id', userId)
        .select('id')
        .maybeSingle();
      if (data) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
  }
}

/**
 * Native Sign in with Apple (iOS). First tap creates the Lobby profile;
 * later taps sign the same person in. No nonce: GoTrue's hex/base64 check
 * disagrees with Apple's nonce encoding.
 */
export async function signInWithNativeApple(): Promise<
  'ok' | 'canceled' | 'unavailable' | { error: string }
> {
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) return 'unavailable';

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { error: 'Apple non ha restituito un token.' };
    }
    const { error } = await getSupabase().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) return { error: error.message };

    const name = displayNameFromApple(credential);
    if (name) await saveAppleDisplayName(name);
    return 'ok';
  } catch (e) {
    return appleError(e);
  }
}
