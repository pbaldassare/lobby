# Lobby Edge Functions

Privileged operations — use `SUPABASE_SERVICE_ROLE_KEY` only inside these functions (never in clients).

| Function | Purpose | Body |
|---|---|---|
| `issue-seal` | Venue staff issues membership seal | `{ "membership_id": "<uuid>" }` |
| `compute-matches` | Score offer/seek overlaps in a room | `{ "room_id": "<uuid>" }` |
| `send-signal` | Contact request (10/UTC day) | `{ "to_profile_id": "<uuid>", "message?": "..." }` |

All require `Authorization: Bearer <user_jwt>` (`verify_jwt: true`).

## Deploy (CLI alternative)

```bash
supabase functions deploy issue-seal --project-ref kxgaqnksylntokyrpaxp
supabase functions deploy compute-matches --project-ref kxgaqnksylntokyrpaxp
supabase functions deploy send-signal --project-ref kxgaqnksylntokyrpaxp
```

SQL helpers: `public.issue_seal`, `public.send_signal`, `public.compute_matches_for_room` (executable by `service_role` only).
