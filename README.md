# Lobby

Networking layer for premium venues (club, lounge, hotel, coworking).  
When you are physically in a venue, you can appear and see who is worth meeting.

## Stack

| Package | Path | Deploy |
| --- | --- | --- |
| Mobile (Expo + RN) | `apps/mobile` | EAS → App Store / Play (**not** Cloudflare) |
| Backoffice (Next.js) | `apps/backoffice` | Cloudflare Pages (OpenNext) |
| Shared | `packages/shared` | consumed by apps |
| Backend | `supabase/` | Supabase project `mjzjracjadlybvdttgto` (schema `lobby`) |

Monorepo: npm workspaces (`apps/*`, `packages/*`). Node `>=20`.

## Privacy (product rules)

- Invisible by default; visible only in the room you are in; visibility ends when you leave.
- Connections require mutual consent.
- Membership “seal” is issued by the **venue**, not the user.
- Selective invisibility: hide from specific people/companies.

## Local setup

```bash
npm install
cp apps/backoffice/.env.example apps/backoffice/.env.local
cp apps/mobile/.env.example apps/mobile/.env
# Fill values from the shared Supabase project (Rank AI / Mediplan / Lobby)
# Dashboard → Settings → API — never commit real secrets
```

Project URL: `https://mjzjracjadlybvdttgto.supabase.co`  
Expose schema `lobby` in Dashboard → Settings → API → Exposed schemas (already enabled).

## Release & deploy

See **[docs/release.md](docs/release.md)** for GitHub, Cloudflare (backoffice), and EAS (mobile).

## Security

- RLS on every table.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (never `NEXT_PUBLIC_` / `EXPO_PUBLIC_`).
- Secrets via Supabase / Cloudflare / EAS dashboards only.
