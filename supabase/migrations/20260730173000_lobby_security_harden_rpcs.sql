-- Hardening privilegi RPC + search_path esplicito su ogni funzione.

create or replace function lobby_private.presence_ttl()
returns interval
language sql
immutable
set search_path = lobby, pg_temp
as $fn$ select interval '90 seconds' $fn$;

create or replace function lobby_private.signal_daily_limit()
returns integer
language sql
immutable
set search_path = lobby, pg_temp
as $fn$ select 10 $fn$;

create or replace function lobby_private.uid()
returns uuid
language sql
stable
set search_path = lobby, pg_temp
as $fn$ select auth.uid() $fn$;

-- RPC privilegiate: solo service_role (Edge Function), mai dal client.
revoke all on function lobby.issue_seal(uuid, uuid) from public, anon, authenticated;
grant execute on function lobby.issue_seal(uuid, uuid) to service_role;

revoke all on function lobby.send_signal(uuid, uuid, text) from public, anon, authenticated;
grant execute on function lobby.send_signal(uuid, uuid, text) to service_role;

revoke all on function lobby.compute_matches_for_room(uuid) from public, anon, authenticated;
grant execute on function lobby.compute_matches_for_room(uuid) to service_role;

-- API di lettura: authenticated + service_role, mai anon.
revoke all on function lobby.are_connected(uuid, uuid) from public, anon;
grant execute on function lobby.are_connected(uuid, uuid) to authenticated, service_role;

revoke all on function lobby.can_discover_profile(uuid) from public, anon;
grant execute on function lobby.can_discover_profile(uuid) to authenticated, service_role;

revoke all on function lobby.is_venue_staff(uuid) from public, anon;
grant execute on function lobby.is_venue_staff(uuid) to authenticated, service_role;

revoke all on function lobby.project_deck_url(uuid) from public, anon;
grant execute on function lobby.project_deck_url(uuid) to authenticated, service_role;

revoke all on function lobby.heartbeat_presence(boolean, timestamptz) from public, anon;
grant execute on function lobby.heartbeat_presence(boolean, timestamptz) to authenticated, service_role;

-- Gli helper interni non devono essere raggiungibili da anon.
revoke all on all functions in schema lobby_private from public, anon;
grant execute on all functions in schema lobby_private to authenticated, service_role;
