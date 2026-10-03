-- Staff: creare un'istanza (locale + stanza + canale QR) e leggere i risultati
-- della serata senza service_role. Le funzioni restano SECURITY DEFINER come
-- le altre RPC Lobby; il gate è ruolo staff/admin o is_venue_staff.

create or replace function lobby.create_instance(
  p_venue_name text,
  p_city text,
  p_room_name text,
  p_opens_at timestamptz default null,
  p_closes_at timestamptz default null
)
returns table (venue_id uuid, room_id uuid)
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  v_role lobby.user_role;
  v_venue uuid;
  v_room uuid;
begin
  if auth.uid() is null then
    raise exception 'Devi fare l''accesso.';
  end if;

  select p.role into v_role from lobby.profiles p where p.id = auth.uid();
  if v_role is null or v_role not in ('staff', 'admin') then
    raise exception 'Serve un account staff o amministratore.';
  end if;

  if p_venue_name is null or length(trim(p_venue_name)) = 0 then
    raise exception 'Il nome del locale è obbligatorio.';
  end if;
  if p_city is null or length(trim(p_city)) = 0 then
    raise exception 'La città è obbligatoria.';
  end if;
  if p_room_name is null or length(trim(p_room_name)) = 0 then
    raise exception 'Il nome della stanza è obbligatorio.';
  end if;
  if p_opens_at is not null and p_closes_at is not null and p_closes_at <= p_opens_at then
    raise exception 'La chiusura deve essere dopo l''apertura.';
  end if;

  insert into lobby.venues (name, city)
  values (trim(p_venue_name), trim(p_city))
  returning id into v_venue;

  insert into lobby.venue_staff (venue_id, profile_id, staff_role)
  values (v_venue, auth.uid(), v_role);

  insert into lobby.rooms (venue_id, name, opens_at, closes_at)
  values (v_venue, trim(p_room_name), p_opens_at, p_closes_at)
  returning id into v_room;

  insert into lobby.room_access (room_id, method)
  values (v_room, 'qr');

  return query select v_venue, v_room;
end;
$fn$;

create or replace function lobby.create_room(
  p_venue_id uuid,
  p_room_name text,
  p_opens_at timestamptz default null,
  p_closes_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  v_room uuid;
begin
  if auth.uid() is null then
    raise exception 'Devi fare l''accesso.';
  end if;
  if not lobby_private.is_venue_staff(p_venue_id, auth.uid()) then
    raise exception 'Non sei autorizzato per questo venue.';
  end if;
  if p_room_name is null or length(trim(p_room_name)) = 0 then
    raise exception 'Il nome della stanza è obbligatorio.';
  end if;
  if p_opens_at is not null and p_closes_at is not null and p_closes_at <= p_opens_at then
    raise exception 'La chiusura deve essere dopo l''apertura.';
  end if;

  insert into lobby.rooms (venue_id, name, opens_at, closes_at)
  values (p_venue_id, trim(p_room_name), p_opens_at, p_closes_at)
  returning id into v_room;

  insert into lobby.room_access (room_id, method)
  select v_room, 'qr'::lobby.access_method
  where not exists (
    select 1 from lobby.room_access a
    where a.room_id = v_room and a.method = 'qr'
  );

  return v_room;
end;
$fn$;

create or replace function lobby.staff_list_presence(p_venue_id uuid)
returns table (
  room_id uuid,
  room_name text,
  profile_id uuid,
  display_name text,
  is_visible boolean,
  entered_at timestamptz
)
language plpgsql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Devi fare l''accesso.';
  end if;
  if not lobby_private.is_venue_staff(p_venue_id, auth.uid()) then
    raise exception 'Non sei autorizzato per questo venue.';
  end if;

  return query
  select
    r.id,
    r.name,
    pr.profile_id,
    p.display_name,
    pr.is_visible,
    pr.entered_at
  from lobby.presence pr
  join lobby.rooms r on r.id = pr.room_id
  join lobby.profiles p on p.id = pr.profile_id
  where r.venue_id = p_venue_id
  order by r.name, pr.entered_at;
end;
$fn$;

create or replace function lobby.staff_list_connections(p_venue_id uuid)
returns table (
  signal_id uuid,
  from_profile_id uuid,
  to_profile_id uuid,
  from_name text,
  to_name text,
  connected_at timestamptz
)
language plpgsql
stable
security definer
set search_path = lobby, pg_temp
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Devi fare l''accesso.';
  end if;
  if not lobby_private.is_venue_staff(p_venue_id, auth.uid()) then
    raise exception 'Non sei autorizzato per questo venue.';
  end if;

  return query
  select
    s.id,
    s.from_profile_id,
    s.to_profile_id,
    a.display_name,
    b.display_name,
    coalesce(s.responded_at, s.created_at)
  from lobby.signals s
  join lobby.memberships ma
    on ma.profile_id = s.from_profile_id and ma.venue_id = p_venue_id
  join lobby.memberships mb
    on mb.profile_id = s.to_profile_id and mb.venue_id = p_venue_id
  join lobby.profiles a on a.id = s.from_profile_id
  join lobby.profiles b on b.id = s.to_profile_id
  where s.status = 'connected'
  order by coalesce(s.responded_at, s.created_at) desc;
end;
$fn$;

revoke all on function lobby.create_instance(text, text, text, timestamptz, timestamptz) from public;
revoke all on function lobby.create_room(uuid, text, timestamptz, timestamptz) from public;
revoke all on function lobby.staff_list_presence(uuid) from public;
revoke all on function lobby.staff_list_connections(uuid) from public;

grant execute on function lobby.create_instance(text, text, text, timestamptz, timestamptz)
  to authenticated, service_role;
grant execute on function lobby.create_room(uuid, text, timestamptz, timestamptz)
  to authenticated, service_role;
grant execute on function lobby.staff_list_presence(uuid)
  to authenticated, service_role;
grant execute on function lobby.staff_list_connections(uuid)
  to authenticated, service_role;
