# Lobby

Networking layer for premium venues. Monorepo scaffold (no domain logic yet).

## Structure

| Package | Path | Deploy |
| --- | --- | --- |
| Mobile (Expo + RN) | `apps/mobile` | EAS → stores (**not** Vercel) |
| Backoffice (Next.js) | `apps/backoffice` | Vercel |
| Shared | `packages/shared` | consumed by apps |
| Backend | `supabase/` | Supabase |

## Setup

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env
cp apps/backoffice/.env.example apps/backoffice/.env.local
# Fill anon / service_role keys from Supabase dashboard — never commit secrets
```

## Scripts

```bash
npm run mobile       # Expo dev server
npm run backoffice   # Next.js on :3000
npm run typecheck
```

See `PROJECT.md` for product rules and stack constraints.
