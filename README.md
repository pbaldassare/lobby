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

## Database

Lobby vive nello schema Postgres **`lobby`** di un progetto Supabase **condiviso** che
ospita anche Mediplan (schema `public`) e Rank AI (schema `rankai`). Lobby non tocca
`public`. Gli helper `SECURITY DEFINER` stanno in `lobby_private`, che non è esposto
via Data API.

I client sono costruiti con `db: { schema: 'lobby' }` (`LOBBY_DB_SCHEMA` in
`packages/shared`), quindi `.from('profiles')` risolve su `lobby.profiles`.

Perché funzioni, `lobby` va aggiunto in **Dashboard → Settings → API → Exposed schemas**
(accanto a `public`, `graphql_public`, `rankai`).

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
