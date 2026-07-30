# Lobby

Networking layer for premium venues (club, lounge, hotel, coworking).  
When you are physically in a venue, you can appear and see who is worth meeting.

## Stack

| Package | Path | Deploy |
| --- | --- | --- |
| Mobile (Expo + RN) | `apps/mobile` | EAS → App Store / Play (**not** Vercel) |
| Backoffice (Next.js) | `apps/backoffice` | Vercel |
| Shared | `packages/shared` | consumed by apps |
| Backend | `supabase/` | Supabase |

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
# Fill values from Supabase dashboard — never commit real secrets
```

## Release & deploy

See **[docs/release.md](docs/release.md)** for GitHub remote/push, Vercel (backoffice), and EAS (mobile) steps.

## Security

- RLS on every table.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (never `NEXT_PUBLIC_` / `EXPO_PUBLIC_`).
- Secrets via Supabase / Vercel / EAS dashboards only.
