-- Privacy audit: visibilità solo con pass, signal solo in stanza,
-- profilo member in INSERT, email confermata per dominio, indici intros.

create or replace function lobby.heartbeat_presence(
  p_visible boolean default null,
  p_visible_until timestamptz default null
)
returns lobby.presence
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  row lobby.presence;
  want_visible boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into row from lobby.presence where profile_id = auth.uid();
  if row.id is null then
    raise exception 'no presence row';
  end if;

  want_visible := coalesce(p_visible, row.is_visible);

  if want_visible and not lobby_private.has_valid_pass(auth.uid(), row.room_id) then
    if p_visible is true then
      raise exception 'valid pass required';
    end if;
    want_visible := false;
  end if;

  update lobby.presence
  set
    last_heartbeat = now(),
    is_visible = want_visible,
    visible_until = case
      when want_visible is false then null
      else coalesce(p_visible_until, visible_until)
    end
  where profile_id = auth.uid()
  returning * into row;

  return row;
end;
$fn$;

drop policy if exists signals_insert_own_from on lobby.signals;
create policy signals_insert_own_from
  on lobby.signals for insert to authenticated
  with check (
    from_profile_id = auth.uid()
    and status = 'pending'
    and not lobby_private.is_blocked(from_profile_id, to_profile_id)
    and lobby_private.can_discover(from_profile_id, to_profile_id)
    and (
      select count(*)::int from lobby.signals s
      where s.from_profile_id = auth.uid()
        and s.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    ) < lobby_private.signal_daily_limit()
  );

drop policy if exists profiles_insert_own on lobby.profiles;
create policy profiles_insert_own
  on lobby.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'member');

create or replace function lobby_private.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
begin
  if tg_op = 'INSERT' then
    if auth.role() <> 'service_role' then
      new.role := 'member';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role changes are server-side only';
  end if;
  return new;
end;
$fn$;

drop trigger if exists profiles_prevent_role_escalation on lobby.profiles;
create trigger profiles_prevent_role_escalation
  before insert or update of role on lobby.profiles
  for each row execute function lobby_private.prevent_profile_role_escalation();

create or replace function lobby.claim_room_by_email(p_room_id uuid)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  r lobby.rooms;
  v_email text;
  v_confirmed timestamptz;
  v_domain text;
  a lobby.room_access;
  v_expires timestamptz;
  v_pass lobby.passes;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into r from lobby.rooms where id = p_room_id;
  if r.id is null then
    raise exception 'room not found';
  end if;
  if not lobby_private.room_is_open(p_room_id) then
    raise exception 'room is closed';
  end if;

  select u.email, u.email_confirmed_at
    into v_email, v_confirmed
  from auth.users u
  where u.id = auth.uid();
  if v_email is null then
    raise exception 'no email on this account';
  end if;
  if v_confirmed is null then
    raise exception 'email not confirmed';
  end if;
  v_domain := lower(split_part(v_email, '@', 2));
  if v_domain in ('privaterelay.appleid.com', 'privaterelay.apple.com') then
    raise exception 'hidden apple email cannot claim a venue domain';
  end if;

  select * into a
  from lobby.room_access
  where room_id = p_room_id and method = 'email_domain' and lower(param) = v_domain;

  if a.id is null then
    raise exception 'this room is not open to %', v_domain;
  end if;

  v_expires := least(
    now() + a.grants_for,
    coalesce(r.closes_at, 'infinity'::timestamptz)
  );

  insert into lobby.passes (profile_id, room_id, method, expires_at)
  values (auth.uid(), p_room_id, 'email_domain', v_expires)
  returning * into v_pass;

  return v_pass;
end;
$fn$;

create index if not exists intros_introducer_idx on lobby.intros (introducer_id);
create index if not exists intros_pair_idx on lobby.intros (profile_a_id, profile_b_id);
