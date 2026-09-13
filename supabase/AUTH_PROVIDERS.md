# Lobby Auth providers

Project: `mjzjracjadlybvdttgto` (Rank AI / Mediplan / **Lobby**)  
URL: https://mjzjracjadlybvdttgto.supabase.co

Schema: `lobby` (do not write Lobby tables into `public`).

MCP cannot enable OAuth providers; configure these in the Dashboard.

**Iscrizione e accesso sono lo stesso tasto** (LinkedIn, Google, Apple). Il primo tap crea `auth.users` + `lobby.profiles`; i successivi fanno login. Vale per PWA e app nativa (EAS).

Dashboard → Authentication → Settings: enable **automatic linking** when the same email is used across providers.

## Email (default)

- **Status**: available by default on new Supabase projects.
- Dashboard → **Authentication** → **Providers** → **Email**: ensure Enabled.
- Optional: confirm email, password strength, magic link.

## Google

1. [Google Cloud Console](https://console.cloud.google.com/) → create OAuth 2.0 Client ID (**Web**). For the native app, also add an iOS client (`com.lobby.app`) if you later switch to native Google Sign-In; browser OAuth uses the Web client.
2. Authorized redirect URI:
   `https://mjzjracjadlybvdttgto.supabase.co/auth/v1/callback`
3. Supabase Dashboard → **Authentication** → **Providers** → **Google**:
   - Enable
   - Paste Client ID + Client Secret
4. Authentication → URL Configuration → Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:8081`
   - `http://localhost:8081/auth/callback`
   - `lobby://**`
   - `lobby://auth/callback`
   - `exp://**` (Expo Go)
   - `https://<backoffice>.pages.dev/auth/callback`
   - `https://lobby-app.pages.dev/**`
   - `https://lobby-app.pages.dev/auth/callback`

## LinkedIn (OIDC)

1. [LinkedIn Developers](https://developers.linkedin.com/) → create app → Auth.
2. Add redirect URL:
   `https://mjzjracjadlybvdttgto.supabase.co/auth/v1/callback`
3. Request OIDC / `openid` `profile` `email`.
4. Supabase Dashboard → **Authentication** → **Providers** → **LinkedIn (OIDC)**:
   - Enable
   - Client ID + Client Secret

Native iOS/Android open LinkedIn and Google in an in-app browser (`WebBrowser.openAuthSessionAsync`), then return to `lobby://auth/callback` and exchange the PKCE code. Same buttons as the PWA: first tap signs up, later taps sign in.

## Apple

Native **iOS** uses Sign in with Apple (`expo-apple-authentication` → `signInWithIdToken`).  
**Android and the PWA** use Supabase OAuth (`provider: apple`) in the browser.

1. Apple Developer → Identifiers → App ID `com.lobby.app` → enable **Sign In with Apple**.
2. Create a **Services ID** for the web/PWA (e.g. `com.lobby.app.web`) with Return URL:
   `https://mjzjracjadlybvdttgto.supabase.co/auth/v1/callback`
3. Create a Key with Sign in with Apple, download `.p8`.
4. Supabase Dashboard → **Authentication** → **Providers** → **Apple**:
   - Enable
   - Client ID = Services ID (web) **and** bundle id `com.lobby.app` for native (Secret Key / Team ID / Key ID as the dashboard asks)
5. EAS: capability is declared in `apps/mobile/app.json` (`usesAppleSignIn`, plugin `expo-apple-authentication`). Rebuild the native binary after this lands.

Apple “Hide My Email” (`@privaterelay.appleid.com`) cannot claim a venue email-domain pass. Members can add a real email later if the venue uses that channel.

## Client usage notes

- Mobile (Expo native + member PWA): `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Member PWA origin: `EXPO_PUBLIC_WEB_ORIGIN` (QR / join HTTPS links)
- Web back-office: `NEXT_PUBLIC_SUPABASE_*`; privileged ops use `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Profile row is auto-created on signup (`lobby_private.handle_new_user` trigger), including OAuth
