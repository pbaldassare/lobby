# Supabase

Lobby backend lives on the **shared** project `mjzjracjadlybvdttgto`
(https://mjzjracjadlybvdttgto.supabase.co) in schema `lobby`.
The same database also hosts Mediplan (`public`) and Rank AI (`rankai`).

- Schema changes go in versioned migrations under `migrations/`.
- Do not apply untracked manual schema edits.
- RLS must be enabled on every table.
- Edge Functions: `issue-seal`, `compute-matches`, `send-signal` (JWT required).
