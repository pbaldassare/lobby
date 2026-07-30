# Lobby Auth providers

Project: `kxgaqnksylntokyrpaxp`  
URL: https://kxgaqnksylntokyrpaxp.supabase.co

MCP cannot enable OAuth providers; configure these in the Dashboard.

## Email (default)

- **Status**: available by default on new Supabase projects.
- Dashboard → **Authentication** → **Providers** → **Email**: ensure Enabled.
- Optional: confirm email, password strength, magic link.

## Google

1. [Google Cloud Console](https://console.cloud.google.com/) → create OAuth 2.0 Client ID (Web).
2. Authorized redirect URI:
   `https://kxgaqnksylntokyrpaxp.supabase.co/auth/v1/callback`
3. Supabase Dashboard → **Authentication** → **Providers** → **Google**:
   - Enable
   - Paste Client ID + Client Secret
4. Add the same redirect URI to Expo / Next.js auth redirect allow-lists (`supabase/config.toml` `additional_redirect_urls` for local).

## LinkedIn (OIDC)

1. [LinkedIn Developers](https://www.linkedin.com/developers/) → create app → Auth.
2. Add redirect URL:
   `https://kxgaqnksylntokyrpaxp.supabase.co/auth/v1/callback`
3. Request OIDC / `openid` `profile` `email` products as required by LinkedIn.
4. Supabase Dashboard → **Authentication** → **Providers** → **LinkedIn (OIDC)**:
   - Enable
   - Client ID + Client Secret

## Client usage notes

- Mobile (Expo): `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Web back-office: `NEXT_PUBLIC_SUPABASE_*`; privileged ops use `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Profile row is auto-created on signup (`private.handle_new_user` trigger)
