export type SocialProvider = 'google' | 'linkedin_oidc' | 'apple';

export type AuthActionResult = {
  error: string | null;
  /** User closed the sheet/browser. Stay on the welcome screen. */
  skipped?: boolean;
};

function paramsFromUrl(raw: string): URLSearchParams {
  const hash = raw.includes('#') ? raw.slice(raw.indexOf('#') + 1) : '';
  const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1).split('#')[0] : '';
  const merged = new URLSearchParams(query);
  if (hash) {
    const fromHash = new URLSearchParams(hash);
    fromHash.forEach((value, key) => {
      if (!merged.get(key)) merged.set(key, value);
    });
  }
  return merged;
}

/** PKCE `code` from `lobby://` or https callback URLs (query or hash). */
export function oauthCodeFromUrl(raw: string): string | null {
  try {
    return paramsFromUrl(raw).get('code');
  } catch {
    return null;
  }
}

/** Provider error on the callback URL. `canceled` if the member closed the prompt. */
export function oauthErrorFromUrl(raw: string): string | null | 'canceled' {
  try {
    const params = paramsFromUrl(raw);
    const code = params.get('error');
    if (!code) return null;
    const description = params.get('error_description') || code;
    if (/access_denied|cancel+ed|denied/i.test(code) || /access_denied|cancel+ed/i.test(description)) {
      return 'canceled';
    }
    return description;
  } catch {
    return null;
  }
}

export function oauthTokensFromUrl(
  raw: string,
): { access_token: string; refresh_token: string } | null {
  try {
    const params = paramsFromUrl(raw);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return null;
    return { access_token, refresh_token };
  } catch {
    return null;
  }
}
