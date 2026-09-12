# Lobby — release & deploy

This document covers GitHub, Cloudflare Workers (backoffice only), and EAS (mobile).

## What deploys where

| Surface | Path | Deploy target |
| --- | --- | --- |
| Backoffice (Next.js) | `apps/backoffice` | **Cloudflare Workers** via OpenNext |
| Mobile (Expo / RN) | `apps/mobile` | **EAS → App Store / Play** (never Cloudflare) |
| Backend | `supabase/` | Shared project `mjzjracjadlybvdttgto` (schema `lobby`) |

Do **not** deploy `apps/web` — the backoffice app is `apps/backoffice`. Treat `apps/web` as unused/legacy if present.

---

## 1. GitHub (local → remote)

Repo: `https://github.com/pbaldassare/lobby`

```bash
git push -u origin main
```

Do **not** commit `.env`, service role keys, or store credentials.

---

## 2. Cloudflare Workers — backoffice only

The backoffice runs on Cloudflare Workers through `@opennextjs/cloudflare`.

Config already in the repo:

- `wrangler.jsonc` at the **repo root** — Cloudflare Git builds look here (Worker `lobby-backoffice`)
- `apps/backoffice/wrangler.jsonc` — same Worker, for `npm run deploy` from `apps/backoffice`
- `apps/backoffice/open-next.config.ts`
- Root `npm run build` runs OpenNext in the backoffice workspace
- `.github/workflows/deploy-backoffice.yml` — optional CLI deploy on push to `main`

### One-time Cloudflare setup

1. Create a Cloudflare account and an API token with **Workers Scripts: Edit** + **Account: Read**.
2. In GitHub → repo → Settings → Secrets and variables → Actions, set:

| Secret | Notes |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token above |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mjzjracjadlybvdttgto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_APP_URL` | Public Worker URL, e.g. `https://lobby-backoffice.<subdomain>.workers.dev` |

`NEXT_PUBLIC_*` must be present at **build** time. Runtime secrets can also be set with:

```bash
cd apps/backoffice
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### CLI deploy (from monorepo root)

```bash
npm install
cd apps/backoffice
cp .env.example .env.local   # fill values, do not commit
npx wrangler login
npm run deploy
```

### Dashboard (Workers, not Pages)

Workers & Pages → **Workers** → Create → Connect GitHub `pbaldassare/lobby`.

Leave **Root directory empty** (the npm workspace lockfile is at the repo root). Do **not** set it to `apps/backoffice`.

| Setting | Value |
| --- | --- |
| Root directory | *(empty / repository root)* |
| Install command | `npm ci` (or the default `npm clean-install`) |
| Build command | `npm run build` |
| Deploy | wrangler uses root `wrangler.jsonc` → `apps/backoffice/.open-next/` |

Also set build-time variables (Settings → Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY` as a **secret** (never `NEXT_PUBLIC_`)

Compatibility flags: `nodejs_compat` (already in `wrangler.jsonc`).

### Reminder

React Native / Expo does **not** deploy to Cloudflare. Mobile builds use EAS.

---

## 3. EAS — mobile (iOS / Android)

Config lives in `apps/mobile/eas.json` with profiles:

| Profile | Purpose |
| --- | --- |
| `development` | Dev client, internal, iOS simulator + Android APK |
| `preview` | Internal QA builds, channel `preview` |
| `production` | Store builds, channel `production`, AAB on Android |

### One-time account / store checklist

- [ ] Expo account (`eas login`)
- [ ] Apple Developer Program membership
- [ ] App Store Connect app + Asc App ID in `eas.json` → `submit.production.ios.ascAppId`
- [ ] Google Play Console app + Play API service account (JSON kept **local / EAS secrets**, never committed)
- [ ] `eas build:configure` (writes `extra.eas.projectId` into `app.json`)
- [ ] Add `runtimeVersion` + `updates` for EAS Update (or let `eas update:configure` set them)
- [ ] Set EAS secrets / env for builds: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Commands (run from `apps/mobile`)

```bash
npm i -g eas-cli
eas login
eas build:configure

eas build --profile development --platform all
eas build --profile preview --platform all
eas build --profile production --platform all

eas update --branch preview --message "QA fix"
eas update --branch production --message "Hotfix"

eas submit --profile production --platform ios
eas submit --profile production --platform android
```

Local templates: `apps/mobile/.env.example`.  
**Never** put `SUPABASE_SERVICE_ROLE_KEY` in the mobile app.

### EAS Update channels

Aligned with `eas.json` build `channel` fields: `development`, `preview`, `production`.

---

## 4. Secrets policy

- `.env` / `.env.*` / `.dev.vars` are gitignored (except `*.env.example`).
- Cloudflare dashboard / Wrangler secrets for backoffice server secrets.
- EAS Secrets / Expo dashboard for mobile public env used at build time.
- Supabase service role: Edge Functions + Next.js server only.

## 5. Auth providers (Google / LinkedIn)

MCP cannot enable OAuth. Follow **[supabase/AUTH_PROVIDERS.md](../supabase/AUTH_PROVIDERS.md)** in the Dashboard of project `mjzjracjadlybvdttgto`.
