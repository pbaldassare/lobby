# Lobby Auth providers

Project: `mjzjracjadlybvdttgto` (Rank AI / Mediplan / **Lobby**)  
URL: https://mjzjracjadlybvdttgto.supabase.co

Schema: `lobby` (do not write Lobby tables into `public`).

MCP cannot enable OAuth providers; configure these in the Dashboard.

## Email (default)

- **Status**: available by default on new Supabase projects.
- Dashboard → **Authentication** → **Providers** → **Email**: ensure Enabled.
- Optional: confirm email, password strength, magic link.

## Google

1. [Google Cloud Console](https://console.cloud.google.com/) → create OAuth 2.0 Client ID (Web).
2. Authorized redirect URI:
   `https://mjzjracjadlybvdttgto.supabase.co/auth/v1/callback`
3. Supabase Dashboard → **Authentication** → **Providers** → **Google**:
   - Enable
   - Paste Client ID + Client Secret
4. Add the same redirect URI plus the backoffice Worker URL and Expo scheme to
   Authentication → URL Configuration → Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:8081`
   - `lobby://**`
   - `https://<your-worker>.workers.dev/auth/callback`

## LinkedIn (OIDC)

1. [LinkedIn Developers](https://www.linkedin.com/developers/) → create app → Auth.
2. Add redirect URL:
   `https://mjzjracjadlybvdttgto.supabase.co/auth/v1/callback`
3. Request OIDC / `openid` `profile` `email` products as required by LinkedIn.
4. Supabase Dashboard → **Authentication** → **Providers** → **LinkedIn (OIDC)**:
   - Enable
   - Client ID + Client Secret

## Client usage notes

- Mobile (Expo): `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Web back-office: `NEXT_PUBLIC_SUPABASE_*`; privileged ops use `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Profile row is auto-created on signup (`lobby_private.handle_new_user` trigger)
