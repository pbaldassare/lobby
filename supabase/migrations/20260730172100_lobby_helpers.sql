-- Lobby: helper di privacy (SECURITY DEFINER in `lobby_private`) + API RPC in `lobby`.
-- Visibilità profilo: stessa room + entrambi visibili + heartbeat fresco + non bloccati.

-- TTL heartbeat: la presence è "viva" se l'ultimo heartbeat rientra in questa finestra
create or replace function lobby_private.presence_ttl()
returns interval
language sql
immutable
as $fn$ select interval '90 seconds' $fn$;

create or replace function lobby_private.signal_daily_limit()
returns integer
language sql
immutable
as $fn$ select 10 $fn$;

create or replace function lobby_private.uid()
returns uuid
language sql
stable
as $fn$ select auth.uid() $fn$;

create or replace function lobby_private.is_blocked(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select exists (
    select 1
    from lobby.blocks b
    where
      (
        b.blocker_id = viewer
        and (
          b.blocked_profile_id = target
          or (
            b.blocked_company is not null
            and exists (
              select 1 from lobby.profiles p
              where p.id = target
                and p.company is not null
                and lower(p.company) = lower(b.blocked_company)
            )
          )
        )
      )
      or (
        b.blocker_id = target
        and (
          b.blocked_profile_id = viewer
          or (
            b.blocked_company is not null
            and exists (
              select 1 from lobby.profiles p
              where p.id = viewer
                and p.company is not null
                and lower(p.company) = lower(b.blocked_company)
            )
          )
        )
      )
  );
$fn$;

create or replace function lobby_private.presence_is_live(p lobby.presence)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select
    p.last_heartbeat > (now() - lobby_private.presence_ttl())
    and (
      not p.is_visible
      or p.visible_until is null
      or p.visible_until > now()
    );
$fn$;

create or replace function lobby_private.share_visible_room(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select exists (
    select 1
    from lobby.presence pv
    join lobby.presence pt on pt.room_id = pv.room_id
    where pv.profile_id = viewer
      and pt.profile_id = target
      and pv.is_visible = true
      and pt.is_visible = true
      and lobby_private.presence_is_live(pv)
      and lobby_private.presence_is_live(pt)
      and (pv.visible_until is null or pv.visible_until > now())
      and (pt.visible_until is null or pt.visible_until > now())
  );
$fn$;

create or replace function lobby_private.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select exists (
    select 1
    from lobby.signals s
    where s.status = 'connected'
      and (
        (s.from_profile_id = a and s.to_profile_id = b)
        or (s.from_profile_id = b and s.to_profile_id = a)
      )
  );
$fn$;

create or replace function lobby_private.is_venue_staff(p_venue_id uuid, p_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select exists (
    select 1
    from lobby.venue_staff vs
    where vs.venue_id = p_venue_id
      and vs.profile_id = p_profile_id
  );
$fn$;

create or replace function lobby_private.is_chat_participant(p_chat_id uuid, p_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select exists (
    select 1
    from lobby.chats c
    where c.id = p_chat_id
      and (c.profile_a_id = p_profile_id or c.profile_b_id = p_profile_id)
  );
$fn$;

create or replace function lobby_private.can_discover(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select
    viewer is not null
    and target is not null
    and viewer <> target
    and lobby_private.share_visible_room(viewer, target)
    and not lobby_private.is_blocked(viewer, target);
$fn$;

-- ---------------------------------------------------------------------------
-- API esposta via Data API (schema `lobby`)
-- ---------------------------------------------------------------------------
create or replace function lobby.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$ select lobby_private.are_connected(a, b) $fn$;

create or replace function lobby.can_discover_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$ select lobby_private.can_discover(auth.uid(), target) $fn$;

create or replace function lobby.is_venue_staff(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$ select lobby_private.is_venue_staff(p_venue_id, auth.uid()) $fn$;

-- Deck privato: la colonna projects.private_deck_url non è leggibile via Data API.
-- Questa funzione la restituisce solo al proprietario o a chi è connesso.
create or replace function lobby.project_deck_url(p_project_id uuid)
returns text
language sql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
  select p.private_deck_url
  from lobby.projects p
  where p.id = p_project_id
    and (
      p.profile_id = auth.uid()
      or (
        p.deck_requestable
        and lobby_private.are_connected(auth.uid(), p.profile_id)
      )
    );
$fn$;

revoke all on function lobby.are_connected(uuid, uuid) from public;
revoke all on function lobby.can_discover_profile(uuid) from public;
revoke all on function lobby.is_venue_staff(uuid) from public;
revoke all on function lobby.project_deck_url(uuid) from public;
grant execute on function lobby.are_connected(uuid, uuid) to authenticated, service_role;
grant execute on function lobby.can_discover_profile(uuid) to authenticated, service_role;
grant execute on function lobby.is_venue_staff(uuid) to authenticated, service_role;
grant execute on function lobby.project_deck_url(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Chat creata automaticamente quando un signal diventa 'connected'
-- ---------------------------------------------------------------------------
create or replace function lobby_private.ensure_chat_on_connect()
returns trigger
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  a uuid;
  b uuid;
begin
  if new.status = 'connected' and (tg_op = 'INSERT' or old.status is distinct from 'connected') then
    a := least(new.from_profile_id, new.to_profile_id);
    b := greatest(new.from_profile_id, new.to_profile_id);
    insert into lobby.chats (profile_a_id, profile_b_id)
    values (a, b)
    on conflict (profile_a_id, profile_b_id) do nothing;
    new.responded_at := coalesce(new.responded_at, now());
  end if;
  return new;
end;
$fn$;

create trigger signals_ensure_chat
  before insert or update of status on lobby.signals
  for each row execute function lobby_private.ensure_chat_on_connect();

-- ---------------------------------------------------------------------------
-- Heartbeat presence
-- ---------------------------------------------------------------------------
create or replace function lobby.heartbeat_presence(p_visible boolean default null, p_visible_until timestamptz default null)
returns lobby.presence
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  row lobby.presence;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update lobby.presence
  set
    last_heartbeat = now(),
    is_visible = coalesce(p_visible, is_visible),
    visible_until = case
      when p_visible is false then null
      else coalesce(p_visible_until, visible_until)
    end
  where profile_id = auth.uid()
  returning * into row;

  if row.id is null then
    raise exception 'no presence row';
  end if;

  return row;
end;
$fn$;

revoke all on function lobby.heartbeat_presence(boolean, timestamptz) from public;
grant execute on function lobby.heartbeat_presence(boolean, timestamptz) to authenticated, service_role;
