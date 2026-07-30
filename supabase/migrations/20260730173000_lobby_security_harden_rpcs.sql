-- Harden RPC privileges + search_path (applied remotely as lobby_security_harden_rpcs)

create or replace function private.presence_ttl()
returns interval
language sql
immutable
set search_path = public
as $$ select interval '90 seconds' $$;

create or replace function private.signal_daily_limit()
returns integer
language sql
immutable
set search_path = public
as $$ select 10 $$;

create or replace function private.uid()
returns uuid
language sql
stable
set search_path = public
as $$ select auth.uid() $$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.issue_seal(uuid, uuid) from public, anon, authenticated;
grant execute on function public.issue_seal(uuid, uuid) to service_role;

revoke all on function public.send_signal(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.send_signal(uuid, uuid, text) to service_role;

revoke all on function public.compute_matches_for_room(uuid) from public, anon, authenticated;
grant execute on function public.compute_matches_for_room(uuid) to service_role;

revoke all on function public.are_connected(uuid, uuid) from public, anon;
grant execute on function public.are_connected(uuid, uuid) to authenticated, service_role;

revoke all on function public.can_discover_profile(uuid) from public, anon;
grant execute on function public.can_discover_profile(uuid) to authenticated, service_role;

revoke all on function public.is_venue_staff(uuid) from public, anon;
grant execute on function public.is_venue_staff(uuid) to authenticated, service_role;

revoke all on function public.heartbeat_presence(boolean, timestamptz) from public, anon;
grant execute on function public.heartbeat_presence(boolean, timestamptz) to authenticated, service_role;
