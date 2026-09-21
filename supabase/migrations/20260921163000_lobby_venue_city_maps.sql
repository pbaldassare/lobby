-- Collega le città dei locali a Google Maps (place_id + coordinate).
-- create_instance accetta i campi Maps in coda; il drop è necessario perché
-- cambia la firma.

alter table lobby.venues
  add column if not exists city_place_id text,
  add column if not exists city_lat double precision,
  add column if not exists city_lng double precision;

comment on column lobby.venues.city_place_id is
  'Google Places place_id della città. Null se non ancora collegata.';
comment on column lobby.venues.city_lat is
  'Latitudine città da Google Maps.';
comment on column lobby.venues.city_lng is
  'Longitudine città da Google Maps.';

-- I demo e i locali già in Milano/Milan.
update lobby.venues
set
  city = 'Milano',
  city_place_id = 'ChIJ53USP0nBhkcRjQ50xhPN_zw',
  city_lat = 45.468503,
  city_lng = 9.1824027
where city_place_id is null
  and lower(trim(city)) in ('milano', 'milan');

drop function if exists lobby.create_instance(text, text, text, timestamptz, timestamptz);

create or replace function lobby.create_instance(
  p_venue_name text,
  p_city text,
  p_room_name text,
  p_opens_at timestamptz default null,
  p_closes_at timestamptz default null,
  p_city_place_id text default null,
  p_city_lat double precision default null,
  p_city_lng double precision default null
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

  insert into lobby.venues (name, city, city_place_id, city_lat, city_lng)
  values (
    trim(p_venue_name),
    trim(p_city),
    nullif(trim(coalesce(p_city_place_id, '')), ''),
    p_city_lat,
    p_city_lng
  )
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

revoke all on function lobby.create_instance(
  text, text, text, timestamptz, timestamptz, text, double precision, double precision
) from public;

grant execute on function lobby.create_instance(
  text, text, text, timestamptz, timestamptz, text, double precision, double precision
) to authenticated, service_role;
