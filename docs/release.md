# Lobby — release & deploy

This document covers GitHub, Vercel (backoffice only), and EAS (mobile).  
**Vercel MCP is not available in the current Cursor environment** — use the Vercel dashboard or CLI steps below.

## What deploys where

| Surface | Path | Deploy target |
| --- | --- | --- |
| Backoffice (Next.js) | `apps/backoffice` | **Vercel only** |
| Mobile (Expo / RN) | `apps/mobile` | **EAS → App Store / Play** (never Vercel) |
| Backend | `supabase/` | Supabase project (migrations + Edge Functions) |

Do **not** deploy `apps/web` to Vercel — the backoffice app is `apps/backoffice`. Treat `apps/web` as unused/legacy if present.

---

## 1. GitHub (local → remote)

Repo may be initialized locally without a remote. From the monorepo root:

```bash
# If git is not initialized yet:
git init -b main

# Create the empty repo on GitHub (pick ONE):
# A) GitHub CLI (requires `gh auth login`)
gh repo create lobby --private --source=. --remote=origin --description "Lobby — premium venue networking"

# B) Manual: create empty repo on github.com, then:
git remote add origin https://github.com/<YOUR_ORG_OR_USER>/lobby.git

# Push (after local commits exist):
git push -u origin main
```

Do **not** commit `.env`, service role keys, or store credentials.

---

## 2. Vercel — backoffice only

### Dashboard setup

1. Import the GitHub repo into [Vercel](https://vercel.com).
2. **Root Directory**: `apps/backoffice` (Project Settings → General).
3. **Framework Preset**: Next.js.
4. **Install Command**: `cd ../.. && npm install`  
   (npm workspaces live at the monorepo root; `@lobby/shared` must resolve).
5. **Build Command**: `npm run build` (runs inside `apps/backoffice`).
6. **Output**: Next.js default (`.next`).
7. **Production Branch**: `main`.
8. Enable **Preview Deployments** for pull requests (default on Vercel).

`apps/backoffice/vercel.json` already sets install/build for the monorepo layout.  
`apps/backoffice/next.config.ts` sets `outputFileTracingRoot` to the monorepo root so `@lobby/shared` traces correctly on Vercel.  
Confirm Root Directory in the dashboard still points at `apps/backoffice`.

### Environment variables (Vercel → Project → Settings → Environment Variables)

Set for **Production**, **Preview**, and **Development** as needed:

| Name | Where it runs | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Anon/public key (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Never `NEXT_PUBLIC_`. Never commit. |

Optional:

| Name | Notes |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical backoffice URL |

See `apps/backoffice/.env.example` for local templates (values stay out of git).

### CLI alternative

```bash
npm i -g vercel
cd apps/backoffice
vercel login
vercel link
# Set Root Directory to apps/backoffice when prompted / in dashboard
vercel env pull   # optional local .env.local — do not commit
vercel           # preview
vercel --prod    # production
```

### Reminder

React Native / Expo does **not** deploy to Vercel. Mobile builds use EAS.

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
- [ ] Rename Expo `slug` / display name to Lobby if still on the template defaults
- [ ] `eas build:configure` (writes `extra.eas.projectId` into `app.json` / `app.config`)
- [ ] Add `runtimeVersion` + `updates` for EAS Update (or let `eas update:configure` set them)
- [ ] Set EAS secrets / env for builds: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Commands (run from `apps/mobile`)

```bash
npm i -g eas-cli
eas login
eas build:configure

# Native binaries
eas build --profile development --platform all
eas build --profile preview --platform all
eas build --profile production --platform all

# OTA JS updates (same channel as build profile)
eas update --branch preview --message "QA fix"
eas update --branch production --message "Hotfix"

# Store submit (credentials required — you run this)
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

Local templates: `apps/mobile/.env.example`.  
**Never** put `SUPABASE_SERVICE_ROLE_KEY` in the mobile app.

### EAS Update channels

Aligned with `eas.json` build `channel` fields: `development`, `preview`, `production`.

---

## 4. Secrets policy

- `.env` / `.env.*` are gitignored (except `*.env.example`).
- Vercel env dashboard for backoffice server secrets.
- EAS Secrets / Expo dashboard for mobile public env used at build time.
- Supabase service role: Edge Functions + Next.js server only.
