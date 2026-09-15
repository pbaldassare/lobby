# Lobby — release & deploy

This document covers GitHub, Cloudflare Pages (backoffice + member PWA), and EAS (native app).

## What deploys where

| Surface | Path | Deploy target |
| --- | --- | --- |
| Backoffice (Next.js) | `apps/backoffice` | **Cloudflare Pages** project **`lobby`** via OpenNext (`_worker.js`) |
| Member PWA (Expo web) | `apps/mobile` | **Cloudflare Pages** project **`lobby-app`** (static SPA) |
| Native app (Expo / RN) | `apps/mobile` | **EAS → App Store / Play** |
| Backend | `supabase/` | Shared project `mjzjracjadlybvdttgto` (schema `lobby`) |

Do **not** deploy `apps/web` — the backoffice app is `apps/backoffice`. Treat `apps/web` as unused/legacy if present.

**Do not Git-connect `lobby-app` to this repo.** Root `wrangler.jsonc` belongs to the backoffice project `lobby`. The member PWA is Direct Upload only (GitHub Action or CLI).

---

## 1. GitHub (local → remote)

Repo: `https://github.com/pbaldassare/lobby`

```bash
git push -u origin main
```

Do **not** commit `.env`, service role keys, or store credentials.

---

## 2. Cloudflare Pages — backoffice only

The backoffice is a Next.js app. OpenNext builds it, then `scripts/cf-pages-stage.mjs` stages **Pages advanced mode** output (static assets + a pre-bundled `_worker.js`). This is **Pages**, not a Workers (`*.workers.dev`) project.

Config already in the repo:

- `wrangler.jsonc` at the **repo root** — `pages_build_output_dir` → `apps/backoffice/.pages-dist` (Pages Git looks here)
- `apps/backoffice/wrangler.jsonc` — same Pages project, for `npm run deploy` from `apps/backoffice`
- `apps/backoffice/open-next.config.ts`
- Root `npm run build` runs OpenNext + the Pages staging script
- `.github/workflows/deploy-backoffice.yml` — **production deploy** (`wrangler pages deploy`, wrangler 4.x)

OpenNext is staged as `_worker.js/app.js` (wrangler 4 bundle) plus a tiny `_worker.js/index.js` trampoline that re-exports it. Pages Git still pins wrangler `3.114.17` and rebundles the entry; it treats other `.js` files in `_worker.js/` as external modules, so it does **not** recompile OpenNext (that compile used to 500 on Next `require-hook.js`).

Root `npm run build` stages that layout. A Cloudflare API token is optional (wrangler 4 Direct Upload if present). GitHub Actions secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` still enable **Actions → Deploy backoffice**.

### One-time Cloudflare setup

1. Create a Cloudflare account and an API token with **Account → Cloudflare Pages: Edit** + **Account Settings: Read**.
2. Workers & Pages → **Pages** → project **`lobby`** (already connected). Production branch must be **`main`** (or a branch that contains the Pages `wrangler.jsonc`). Do not retry old deployments of `e459347`.
3. In GitHub → repo → Settings → Secrets and variables → Actions, set:

| Secret | Notes |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token above |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Overview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mjzjracjadlybvdttgto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_APP_URL` | Public Pages URL, e.g. `https://lobby.pages.dev` |

`NEXT_PUBLIC_*` must be present at **build** time. In the Pages project, also set the same values under Settings → Environment variables (Production + Preview), with `SUPABASE_SERVICE_ROLE_KEY` as a **secret**.

### CLI deploy (from monorepo root)

```bash
npm install
cd apps/backoffice
cp .env.example .env.local   # fill values, do not commit
npx wrangler login
npm run deploy
```

That runs OpenNext, stages `.pages-dist`, then `wrangler pages deploy`.

### Dashboard (Pages Git — optional)

If the Pages project is Git-connected to `pbaldassare/lobby`:

**Production branch must be a commit that has root `package.json` `"build"` and root `wrangler.jsonc` with `pages_build_output_dir`.** A Retry of commit `e459347` will always fail (`Missing script: "build"`). Change production branch to `main` after this lands, or redeploy the latest SHA — do not retry the old job.

Leave **Root directory empty** (the npm workspace lockfile is at the repo root). Do **not** set it to `apps/backoffice`.

| Setting | Value |
| --- | --- |
| Root directory | *(empty / repository root)* |
| Framework preset | None |
| Install command | `npm ci` (or the default `npm clean-install`) |
| Build command | `npm run build` |
| Build output | from root `wrangler.jsonc` → `apps/backoffice/.pages-dist` |

Also set build-time variables (Settings → Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY` as a **secret** (never `NEXT_PUBLIC_`)
- `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (optional wrangler 4 Direct Upload)

Compatibility flags: `nodejs_compat` (already in `wrangler.jsonc`).

### Reminder

The **native** Expo app does **not** deploy to Cloudflare. Store builds use EAS. The **member PWA** is a separate Pages project (`lobby-app`).

---

## 2b. Cloudflare Pages — member PWA (`lobby-app`)

Same Expo app as the stores (`apps/mobile`), exported as a single-page PWA (`web.output: "single"`). Installable from the browser (Add to Home Screen). Push notifications stay native-only.

One-time:

1. Workers & Pages → **Pages** → Create project **`lobby-app`**. Choose **Direct Upload** (do not connect Git — this repo’s root Wrangler config is the backoffice).
2. GitHub secrets (same Cloudflare token/account as the backoffice Action):

| Secret | Notes |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Account → Cloudflare Pages: Edit |
| `CLOUDFLARE_ACCOUNT_ID` | `daba97cd2972d30ce6fdcdabd845818a` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://mjzjracjadlybvdttgto.supabase.co` (optional; build has a public fallback) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key only |
| `EXPO_PUBLIC_WEB_ORIGIN` | Canonical PWA URL, e.g. `https://lobby-app.pages.dev` |

3. Supabase → Authentication → URL Configuration → Redirect URLs, add:
   - `https://lobby-app.pages.dev/**`
   - `https://lobby-app.pages.dev/auth/callback`
   - `http://localhost:8081/**`
   - `http://localhost:8081/auth/callback`

CLI:

```bash
npm install
npm run mobile:web
cd apps/mobile
npx wrangler pages deploy dist --project-name=lobby-app
```

Or **Actions → Deploy member web (Cloudflare Pages) → Run workflow**.

Local preview of the exported PWA:

```bash
npm run mobile:web
npx serve apps/mobile/dist --single
```

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
- Cloudflare Pages dashboard / GitHub Actions env for backoffice server secrets.
- EAS Secrets / Expo dashboard for mobile public env used at build time.
- Supabase service role: Edge Functions + Next.js server only.

## 5. Auth providers (Google / LinkedIn)

MCP cannot enable OAuth. Follow **[supabase/AUTH_PROVIDERS.md](../supabase/AUTH_PROVIDERS.md)** in the Dashboard of project `mjzjracjadlybvdttgto`.
