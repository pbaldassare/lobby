-- Lobby: il perimetro.
--
-- Fino a qui la presenza era auto-dichiarata: bastava conoscere l'UUID di una
-- stanza per scrivere la propria riga ed essere dentro, da qualunque posto.
-- Il QR sul poster era una stringa fissa e senza scadenza, quindi fotografarlo
-- equivaleva ad avere le chiavi per sempre.
--
-- L'idea: il perimetro non è un luogo, è una PROVA CHE SCADE. Un QR valido tre
-- ore, una rete WiFi, un dominio email, un invito dimostrano tutti la stessa
-- cosa — "questa persona può stare in questa stanza fino a quest'ora" — e
-- cambiano solo nel canale. Quindi non quattro meccanismi: uno solo, il
-- PERMESSO, alimentato da quattro sorgenti.

-- ---------------------------------------------------------------------------
-- Le stanze acquistano una vita
-- ---------------------------------------------------------------------------
alter table lobby.rooms
  add column opens_at timestamptz,
  add column closes_at timestamptz,
  -- Segreto da cui si deriva il codice a rotazione. Non esce mai dal database:
  -- nessuna policy lo espone e le funzioni che lo usano sono SECURITY DEFINER.
  -- pgcrypto vive nello schema `extensions`, che non sta nel search_path
  -- ristretto di queste funzioni: va qualificato a mano.
  add column code_secret bytea not null default extensions.gen_random_bytes(32);

alter table lobby.rooms
  add constraint rooms_window_ordered check (
    opens_at is null or closes_at is null or closes_at > opens_at
  );

comment on column lobby.rooms.closes_at is
  'Una serata è una stanza che finisce. Null = stanza permanente.';

create index rooms_open_idx on lobby.rooms (venue_id, closes_at)
  where closes_at is not null;

create or replace function lobby_private.room_is_open(p_room_id uuid)
returns boolean
language sql stable security definer set search_path = lobby, pg_temp
as $fn$
  select exists (
    select 1 from lobby.rooms r
    where r.id = p_room_id
      and now() >= coalesce(r.opens_at, '-infinity'::timestamptz)
      and now() <  coalesce(r.closes_at, 'infinity'::timestamptz)
  );
$fn$;

-- ---------------------------------------------------------------------------
-- I canali di accesso
-- ---------------------------------------------------------------------------
create type lobby.access_method as enum (
  'qr',            -- codice esposto all'ingresso, rigenerato di continuo
  'wifi_portal',   -- il portale del router consegna il permesso
  'email_domain',  -- appartenenza a un dominio verificato
  'invite',        -- qualcuno che è dentro porta un ospite
  'membership'     -- socio col sigillo del venue
);

create table lobby.room_access (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references lobby.rooms (id) on delete cascade,
  method lobby.access_method not null,
  /** Parametro dipendente dal metodo: il dominio per `email_domain`,
      l'identificativo della rete per `wifi_portal`. Null per `qr`. */
  param text,
  /** Durata del permesso concesso da questo canale. Viene comunque troncata
      alla chiusura della stanza. */
  grants_for interval not null default interval '12 hours',
  created_at timestamptz not null default now()
);

create unique index room_access_uidx
  on lobby.room_access (room_id, method, coalesce(lower(param), ''));

comment on table lobby.room_access is
  'Quali canali aprono questa stanza. Aggiungerne uno non tocca il resto: il permesso è sempre lo stesso.';

-- ---------------------------------------------------------------------------
-- Il permesso
-- ---------------------------------------------------------------------------
create table lobby.passes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references lobby.profiles (id) on delete cascade,
  room_id uuid not null references lobby.rooms (id) on delete cascade,
  method lobby.access_method not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  /** Chi lo ha rilasciato, dove ha senso: lo staff per un invito, il socio che
      porta un ospite. Null quando è il canale stesso a rilasciarlo. */
  granted_by uuid references lobby.profiles (id) on delete set null,
  constraint passes_window_ordered check (expires_at > granted_at)
);

create index passes_lookup_idx
  on lobby.passes (profile_id, room_id, expires_at desc)
  where revoked_at is null;

create index passes_room_idx on lobby.passes (room_id, granted_at desc);

comment on table lobby.passes is
  'Prova che una persona può stare in una stanza fino a un momento preciso. Lo rilascia sempre il server, mai il client.';

create or replace function lobby_private.has_valid_pass(p_profile_id uuid, p_room_id uuid)
returns boolean
language sql stable security definer set search_path = lobby, pg_temp
as $fn$
  select exists (
    select 1 from lobby.passes p
    where p.profile_id = p_profile_id
      and p.room_id = p_room_id
      and p.revoked_at is null
      and p.expires_at > now()
  );
$fn$;

-- ---------------------------------------------------------------------------
-- Il codice a rotazione
--
-- Derivato dal segreto della stanza e dalla finestra temporale corrente: non
-- va memorizzato da nessuna parte, si ricalcola. Chi fotografa il poster
-- ottiene un codice che tra pochi minuti non vale più.
-- ---------------------------------------------------------------------------
create or replace function lobby_private.code_window_seconds()
returns integer language sql immutable set search_path = lobby, pg_temp
as $fn$ select 180 $fn$;

create or replace function lobby_private.room_code_at(p_room_id uuid, p_window bigint)
returns text
language sql stable security definer set search_path = lobby, pg_temp
as $fn$
  -- hmac accetta (bytea, bytea, text) oppure (text, text, text): la chiave è
  -- bytea, quindi anche il dato va convertito, non passato come text.
  select upper(substr(
    encode(extensions.hmac(convert_to(p_window::text, 'UTF8'), r.code_secret, 'sha256'), 'hex'),
    1, 6))
  from lobby.rooms r
  where r.id = p_room_id;
$fn$;

/** Il codice da mostrare adesso. Solo lo staff del venue. */
create or replace function lobby.current_room_code(p_room_id uuid)
returns table (code text, expires_in integer)
language plpgsql stable security definer set search_path = lobby, pg_temp
as $fn$
declare
  v_venue uuid;
  w bigint;
  span integer := lobby_private.code_window_seconds();
begin
  select venue_id into v_venue from lobby.rooms where id = p_room_id;
  if v_venue is null then
    raise exception 'room not found';
  end if;
  if not lobby_private.is_venue_staff(v_venue, auth.uid()) then
    raise exception 'not venue staff for this venue';
  end if;

  w := floor(extract(epoch from now()) / span);
  return query
    select lobby_private.room_code_at(p_room_id, w),
           span - (floor(extract(epoch from now()))::bigint % span)::integer;
end;
$fn$;

/** Riscatta il codice e ottiene il permesso. La chiama il socio. */
create or replace function lobby.redeem_room_code(p_room_id uuid, p_code text)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  r lobby.rooms;
  w bigint;
  span integer := lobby_private.code_window_seconds();
  v_for interval;
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
  if not exists (
    select 1 from lobby.room_access a where a.room_id = p_room_id and a.method = 'qr'
  ) then
    raise exception 'this room does not open with a code';
  end if;

  w := floor(extract(epoch from now()) / span);
  -- Si accetta anche la finestra precedente: fra l'inquadrare e il toccare
  -- passa qualche secondo, e il codice non deve scadere in mano a chi lo legge.
  if upper(trim(p_code)) not in (
    lobby_private.room_code_at(p_room_id, w),
    lobby_private.room_code_at(p_room_id, w - 1)
  ) then
    raise exception 'invalid or expired code';
  end if;

  select a.grants_for into v_for
  from lobby.room_access a
  where a.room_id = p_room_id and a.method = 'qr';

  v_expires := least(
    now() + coalesce(v_for, interval '12 hours'),
    coalesce(r.closes_at, 'infinity'::timestamptz)
  );

  insert into lobby.passes (profile_id, room_id, method, expires_at)
  values (auth.uid(), p_room_id, 'qr', v_expires)
  returning * into v_pass;

  return v_pass;
end;
$fn$;

/** Canale "contesto": il dominio della mail verificata apre la stanza. */
create or replace function lobby.claim_room_by_email(p_room_id uuid)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  r lobby.rooms;
  v_email text;
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

  select u.email into v_email from auth.users u where u.id = auth.uid();
  if v_email is null then
    raise exception 'no email on this account';
  end if;
  v_domain := lower(split_part(v_email, '@', 2));

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

/** Permesso rilasciato a mano: invito o socio. Solo lo staff del venue. */
create or replace function lobby.grant_pass(
  p_room_id uuid,
  p_profile_id uuid,
  p_method lobby.access_method default 'invite',
  p_hours integer default 12
)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  r lobby.rooms;
  v_pass lobby.passes;
begin
  select * into r from lobby.rooms where id = p_room_id;
  if r.id is null then
    raise exception 'room not found';
  end if;
  if not lobby_private.is_venue_staff(r.venue_id, auth.uid()) then
    raise exception 'not venue staff for this venue';
  end if;

  insert into lobby.passes (profile_id, room_id, method, expires_at, granted_by)
  values (
    p_profile_id,
    p_room_id,
    p_method,
    least(
      now() + make_interval(hours => greatest(p_hours, 1)),
      coalesce(r.closes_at, 'infinity'::timestamptz)
    ),
    auth.uid()
  )
  returning * into v_pass;

  return v_pass;
end;
$fn$;

/** Revoca. Il permesso si toglie, non si cancella: resta la traccia. */
create or replace function lobby.revoke_pass(p_pass_id uuid)
returns lobby.passes
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  v_pass lobby.passes;
  v_venue uuid;
begin
  select r.venue_id into v_venue
  from lobby.passes p join lobby.rooms r on r.id = p.room_id
  where p.id = p_pass_id;

  if v_venue is null then
    raise exception 'pass not found';
  end if;
  if not lobby_private.is_venue_staff(v_venue, auth.uid()) then
    raise exception 'not venue staff for this venue';
  end if;

  update lobby.passes set revoked_at = now()
  where id = p_pass_id and revoked_at is null
  returning * into v_pass;

  -- Revocare il permesso porta fuori dalla stanza: altrimenti resteresti
  -- visibile con un titolo che non hai più.
  delete from lobby.presence
  where profile_id = (select profile_id from lobby.passes where id = p_pass_id)
    and room_id = (select room_id from lobby.passes where id = p_pass_id);

  return v_pass;
end;
$fn$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table lobby.room_access enable row level security;
alter table lobby.room_access force row level security;
alter table lobby.passes enable row level security;
alter table lobby.passes force row level security;

/** I canali di una stanza si vedono: servono all'app per sapere cosa proporre.
    Il segreto non è qui — sta su `rooms.code_secret`, che nessuno legge. */
create policy room_access_select_authenticated
  on lobby.room_access for select to authenticated
  using (true);

create policy room_access_write_venue_staff
  on lobby.room_access for all to authenticated
  using (
    exists (
      select 1 from lobby.rooms r
      where r.id = room_access.room_id
        and lobby_private.is_venue_staff(r.venue_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from lobby.rooms r
      where r.id = room_id
        and lobby_private.is_venue_staff(r.venue_id, auth.uid())
    )
  );

create policy passes_select_own_or_venue_staff
  on lobby.passes for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from lobby.rooms r
      where r.id = passes.room_id
        and lobby_private.is_venue_staff(r.venue_id, auth.uid())
    )
  );

-- Nessuna policy di INSERT, UPDATE o DELETE: i permessi si creano solo
-- attraverso le funzioni qui sopra. Un client non può scriversi un permesso.

grant select on lobby.room_access, lobby.passes to authenticated;
grant insert, update, delete on lobby.room_access to authenticated;
revoke all on lobby.room_access, lobby.passes from anon;

revoke all on function lobby.current_room_code(uuid) from public, anon;
grant execute on function lobby.current_room_code(uuid) to authenticated, service_role;

revoke all on function lobby.redeem_room_code(uuid, text) from public, anon;
grant execute on function lobby.redeem_room_code(uuid, text) to authenticated, service_role;

revoke all on function lobby.claim_room_by_email(uuid) from public, anon;
grant execute on function lobby.claim_room_by_email(uuid) to authenticated, service_role;

revoke all on function lobby.grant_pass(uuid, uuid, lobby.access_method, integer) from public, anon;
grant execute on function lobby.grant_pass(uuid, uuid, lobby.access_method, integer) to authenticated, service_role;

revoke all on function lobby.revoke_pass(uuid) from public, anon;
grant execute on function lobby.revoke_pass(uuid) to authenticated, service_role;

grant execute on all functions in schema lobby_private to authenticated, service_role;
revoke all on all functions in schema lobby_private from public, anon;

-- ---------------------------------------------------------------------------
-- La presenza smette di essere auto-dichiarata
-- ---------------------------------------------------------------------------
drop policy presence_insert_own on lobby.presence;
drop policy presence_update_own on lobby.presence;

create policy presence_insert_with_pass
  on lobby.presence for insert to authenticated
  with check (
    profile_id = auth.uid()
    and is_visible = false
    and lobby_private.has_valid_pass(auth.uid(), room_id)
  );

/** Uscire e nascondersi restano sempre possibili. Rendersi visibili no: per
    quello serve un permesso ancora valido. */
create policy presence_update_own
  on lobby.presence for update to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and (
      is_visible = false
      or lobby_private.has_valid_pass(auth.uid(), room_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Pulizia: la serata finisce e la stanza si svuota da sola
-- ---------------------------------------------------------------------------
create or replace function lobby.sweep_expired_presence()
returns integer
language plpgsql security definer set search_path = lobby, pg_temp
as $fn$
declare
  n integer;
begin
  delete from lobby.presence p
  where not lobby_private.has_valid_pass(p.profile_id, p.room_id)
     or not lobby_private.room_is_open(p.room_id);
  get diagnostics n = row_count;
  return n;
end;
$fn$;

revoke all on function lobby.sweep_expired_presence() from public, anon, authenticated;
grant execute on function lobby.sweep_expired_presence() to service_role;
