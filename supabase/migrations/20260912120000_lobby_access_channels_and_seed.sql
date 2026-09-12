-- Lobby: canali di accesso restanti + seed del primo venue.
--
-- QR e invito staff esistevano già. Mancavano: Wi‑Fi, dominio email (già RPC),
-- membership, invito da chi è già dentro. Il segreto della stanza non deve
-- uscire dal database: si toglie dalle grant di SELECT/UPDATE/INSERT.

-- ---------------------------------------------------------------------------
-- code_secret: nessuna colonna segreta visibile al client
-- ---------------------------------------------------------------------------
revoke select on lobby.rooms from authenticated;
revoke insert on lobby.rooms from authenticated;
revoke update on lobby.rooms from authenticated;

grant select (id, venue_id, name, created_at, opens_at, closes_at)
  on lobby.rooms to authenticated;
grant insert (id, venue_id, name, opens_at, closes_at)
  on lobby.rooms to authenticated;
grant update (name, opens_at, closes_at)
  on lobby.rooms to authenticated;
grant delete on lobby.rooms to authenticated;

-- ---------------------------------------------------------------------------
-- Wi‑Fi: il portale (o il codice rete all'ingresso) dimostra la stessa cosa
-- del QR, con un altro canale.
-- ---------------------------------------------------------------------------
create or replace function lobby.claim_room_by_wifi(p_room_id uuid, p_network text)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  r lobby.rooms;
  a lobby.room_access;
  v_expires timestamptz;
  v_pass lobby.passes;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_network is null or length(trim(p_network)) = 0 then
    raise exception 'network token required';
  end if;

  select * into r from lobby.rooms where id = p_room_id;
  if r.id is null then
    raise exception 'room not found';
  end if;
  if not lobby_private.room_is_open(p_room_id) then
    raise exception 'room is closed';
  end if;

  select * into a
  from lobby.room_access
  where room_id = p_room_id
    and method = 'wifi_portal'
    and lower(param) = lower(trim(p_network));

  if a.id is null then
    raise exception 'this room is not open on that network';
  end if;

  v_expires := least(
    now() + a.grants_for,
    coalesce(r.closes_at, 'infinity'::timestamptz)
  );

  insert into lobby.passes (profile_id, room_id, method, expires_at)
  values (auth.uid(), p_room_id, 'wifi_portal', v_expires)
  returning * into v_pass;

  return v_pass;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- Socio col sigillo: il venue ha già provato chi sei.
-- ---------------------------------------------------------------------------
create or replace function lobby.claim_room_by_membership(p_room_id uuid)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  r lobby.rooms;
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

  select * into a
  from lobby.room_access
  where room_id = p_room_id and method = 'membership';

  if a.id is null then
    raise exception 'this room does not open with membership';
  end if;

  if not exists (
    select 1
    from lobby.memberships m
    where m.profile_id = auth.uid()
      and m.venue_id = r.venue_id
      and m.verified_status = 'verified'
      and m.seal_issued_at is not null
  ) then
    raise exception 'no sealed membership for this venue';
  end if;

  v_expires := least(
    now() + a.grants_for,
    coalesce(r.closes_at, 'infinity'::timestamptz)
  );

  insert into lobby.passes (profile_id, room_id, method, expires_at)
  values (auth.uid(), p_room_id, 'membership', v_expires)
  returning * into v_pass;

  return v_pass;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- Invito: chi è già dentro (pass valido) porta un ospite.
-- Lo staff continua a usare grant_pass.
-- ---------------------------------------------------------------------------
create or replace function lobby.invite_to_room(p_room_id uuid, p_guest_id uuid)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  r lobby.rooms;
  a lobby.room_access;
  v_expires timestamptz;
  v_pass lobby.passes;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_guest_id = auth.uid() then
    raise exception 'cannot invite yourself';
  end if;
  if not exists (select 1 from lobby.profiles p where p.id = p_guest_id) then
    raise exception 'guest not found';
  end if;

  select * into r from lobby.rooms where id = p_room_id;
  if r.id is null then
    raise exception 'room not found';
  end if;
  if not lobby_private.room_is_open(p_room_id) then
    raise exception 'room is closed';
  end if;
  if not lobby_private.has_valid_pass(auth.uid(), p_room_id) then
    raise exception 'you need a valid pass to invite';
  end if;

  select * into a
  from lobby.room_access
  where room_id = p_room_id and method = 'invite';

  if a.id is null then
    raise exception 'this room does not accept invites';
  end if;

  if lobby_private.is_blocked(auth.uid(), p_guest_id) then
    raise exception 'blocked';
  end if;

  v_expires := least(
    now() + a.grants_for,
    coalesce(r.closes_at, 'infinity'::timestamptz)
  );

  insert into lobby.passes (profile_id, room_id, method, expires_at, granted_by)
  values (p_guest_id, p_room_id, 'invite', v_expires, auth.uid())
  returning * into v_pass;

  return v_pass;
end;
$fn$;

revoke all on function lobby.claim_room_by_wifi(uuid, text) from public, anon;
grant execute on function lobby.claim_room_by_wifi(uuid, text) to authenticated, service_role;

revoke all on function lobby.claim_room_by_membership(uuid) from public, anon;
grant execute on function lobby.claim_room_by_membership(uuid) to authenticated, service_role;

revoke all on function lobby.invite_to_room(uuid, uuid) from public, anon;
grant execute on function lobby.invite_to_room(uuid, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Seed: un venue e una stanza su cui esercitare i canali.
-- Nessun utente: lo staff si assegna a parte (service_role / back-office).
-- ---------------------------------------------------------------------------
insert into lobby.venues (id, name, city)
values (
  'a1111111-1111-4111-8111-111111111111',
  'Lobby House',
  'Milan'
)
on conflict (id) do nothing;

insert into lobby.rooms (id, venue_id, name)
values (
  'a2222222-2222-4222-8222-222222222222',
  'a1111111-1111-4111-8111-111111111111',
  'Members Lounge'
)
on conflict (id) do nothing;

insert into lobby.room_access (room_id, method, param, grants_for)
select v.room_id, v.method, v.param, v.grants_for
from (
  values
    (
      'a2222222-2222-4222-8222-222222222222'::uuid,
      'qr'::lobby.access_method,
      null::text,
      interval '12 hours'
    ),
    (
      'a2222222-2222-4222-8222-222222222222'::uuid,
      'invite'::lobby.access_method,
      null::text,
      interval '8 hours'
    ),
    (
      'a2222222-2222-4222-8222-222222222222'::uuid,
      'membership'::lobby.access_method,
      null::text,
      interval '12 hours'
    ),
    (
      'a2222222-2222-4222-8222-222222222222'::uuid,
      'wifi_portal'::lobby.access_method,
      'lobby-house',
      interval '12 hours'
    )
) as v(room_id, method, param, grants_for)
where not exists (
  select 1
  from lobby.room_access a
  where a.room_id = v.room_id
    and a.method = v.method
    and coalesce(lower(a.param), '') = coalesce(lower(v.param), '')
);
