# Progetto: LOBBY

## Cos'è
Lobby è il layer di networking per venue premium (club, lounge, hotel, coworking).
Quando sei fisicamente in un venue, puoi apparire e vedere chi vale la pena incontrare.

## Regole d'oro del prodotto (non violarle mai)
- PRIVACY È IL PRODOTTO: invisibile di default; visibile SOLO nella stanza in cui sei;
  la visibilità si spegne quando esci. Connessione SOLO per consenso reciproco.
- Il "sigillo" di membership lo rilascia il VENUE, non l'utente.
- Selective invisibility: l'utente può nascondersi da persone/aziende specifiche.

## Stack
- Mobile: Expo + React Native + TypeScript (expo-router, EAS).
- Web (back-office): Next.js + TypeScript, deploy su Cloudflare Pages (OpenNext).
- Backend UNICO condiviso: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions).
- Monorepo npm workspaces; codice condiviso in packages/shared.

## Sicurezza (tassativo)
- RLS attiva su OGNI tabella. Nessuna tabella senza policy.
- La service_role key NON tocca mai il client (né bundle mobile né codice web pubblico):
  vive solo server-side (Next.js server actions/route handlers) o nelle Edge Functions.
- Segreti solo via dashboard (Supabase/Cloudflare/EAS). Mai committati. .env in .gitignore.
- Operazioni privilegiate (rilascio sigillo, calcolo match, moderazione) = server-side.

## Convenzioni
- TS strict, niente `any`. Nomi di codice/DB in inglese; commenti in italiano ok.
- ESLint + Prettier. Commit in stile conventional (feat:, fix:, chore:).
- App mobile = utente normale + RLS. Back-office = ruoli admin/staff + operazioni server-side.

## Uso degli MCP
- Stitch: PRIMA `extract design context` (design.md/token) POI genera, per coerenza visiva.
  Le grafiche/template le fornisce l'utente: usale come fonte, non inventare un nuovo stile.
- Supabase: usa il progetto che fornisce l'utente. Ogni modifica allo schema = migration
  versionata in /supabase/migrations, mai modifiche "a mano" non tracciate.
- Cloudflare: solo per il deploy del back-office web (Pages).

## Cosa NON è vero (evita l'errore classico)
- L'app React Native NON si deploya su Cloudflare. Va agli store via EAS.
- Il codice uscito da Stitch è un punto di partenza, va rifinito.
