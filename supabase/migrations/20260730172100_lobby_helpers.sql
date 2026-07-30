-- Lobby privacy helpers (applied remotely as lobby_helpers)
-- See companion RLS migrations and realtime/RPC migration.

create or replace function private.presence_ttl()
returns interval
language sql
immutable
as $$ select interval '90 seconds' $$;

create or replace function private.signal_daily_limit()
returns integer
language sql
immutable
as $$ select 10 $$;

create or replace function private.uid()
returns uuid
language sql
stable
as $$ select auth.uid() $$;

create or replace function private.is_blocked(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks b
    where
      (
        b.blocker_id = viewer
        and (
          b.blocked_profile_id = target
          or (
            b.blocked_company is not null
            and exists (
              select 1 from public.profiles p
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
              select 1 from public.profiles p
              where p.id = viewer
                and p.company is not null
                and lower(p.company) = lower(b.blocked_company)
            )
          )
        )
      )
  );
$$;

create or replace function private.presence_is_live(p public.presence)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p.last_heartbeat > (now() - private.presence_ttl())
    and (
      not p.is_visible
      or p.visible_until is null
      or p.visible_until > now()
    );
$$;

create or replace function private.share_visible_room(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.presence pv
    join public.presence pt on pt.room_id = pv.room_id
    where pv.profile_id = viewer
      and pt.profile_id = target
      and pv.is_visible = true
      and pt.is_visible = true
      and private.presence_is_live(pv)
      and private.presence_is_live(pt)
      and (pv.visible_until is null or pv.visible_until > now())
      and (pt.visible_until is null or pt.visible_until > now())
  );
$$;

create or replace function private.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.signals s
    where s.status = 'connected'
      and (
        (s.from_profile_id = a and s.to_profile_id = b)
        or (s.from_profile_id = b and s.to_profile_id = a)
      )
  );
$$;

create or replace function private.is_venue_staff(p_venue_id uuid, p_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.venue_staff vs
    where vs.venue_id = p_venue_id
      and vs.profile_id = p_profile_id
  );
$$;

create or replace function private.is_chat_participant(p_chat_id uuid, p_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chats c
    where c.id = p_chat_id
      and (c.profile_a_id = p_profile_id or c.profile_b_id = p_profile_id)
  );
$$;

create or replace function private.can_discover(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    viewer is not null
    and target is not null
    and viewer <> target
    and private.share_visible_room(viewer, target)
    and not private.is_blocked(viewer, target);
$$;

create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select private.are_connected(a, b) $$;

create or replace function public.can_discover_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select private.can_discover(auth.uid(), target) $$;

create or replace function public.is_venue_staff(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select private.is_venue_staff(p_venue_id, auth.uid()) $$;

revoke all on function public.are_connected(uuid, uuid) from public;
revoke all on function public.can_discover_profile(uuid) from public;
revoke all on function public.is_venue_staff(uuid) from public;
grant execute on function public.are_connected(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_discover_profile(uuid) to authenticated, service_role;
grant execute on function public.is_venue_staff(uuid) to authenticated, service_role;

create or replace function private.ensure_chat_on_connect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a uuid;
  b uuid;
begin
  if new.status = 'connected' and (tg_op = 'INSERT' or old.status is distinct from 'connected') then
    a := least(new.from_profile_id, new.to_profile_id);
    b := greatest(new.from_profile_id, new.to_profile_id);
    insert into public.chats (profile_a_id, profile_b_id)
    values (a, b)
    on conflict (profile_a_id, profile_b_id) do nothing;
    new.responded_at := coalesce(new.responded_at, now());
  end if;
  return new;
end;
$$;

create trigger signals_ensure_chat
  before insert or update of status on public.signals
  for each row execute function private.ensure_chat_on_connect();

create or replace function public.heartbeat_presence(p_visible boolean default null, p_visible_until timestamptz default null)
returns public.presence
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.presence;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.presence
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
$$;

revoke all on function public.heartbeat_presence(boolean, timestamptz) from public;
grant execute on function public.heartbeat_presence(boolean, timestamptz) to authenticated, service_role;
