-- Lobby domain schema — schema dedicato `lobby` su progetto Supabase condiviso.
-- Privacy-first: invisibile di default; presence opt-in; sigillo emesso dal venue; RLS su ogni tabella.
--
-- NOTA: questo progetto ospita anche Mediplan (schema `public`) e Rank AI (schema `rankai`).
-- Lobby non tocca `public`. Gli helper SECURITY DEFINER stanno in `lobby_private`
-- (nome prefissato: `private` è troppo generico per un progetto condiviso).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Schemi
-- ---------------------------------------------------------------------------
create schema if not exists lobby;
create schema if not exists lobby_private;

revoke all on schema lobby_private from public;
revoke all on schema lobby_private from anon, authenticated;
grant usage on schema lobby_private to postgres, service_role;

grant usage on schema lobby to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type lobby.user_role as enum ('member', 'staff', 'admin');
create type lobby.verification_status as enum ('pending', 'verified', 'rejected', 'revoked');
create type lobby.signal_status as enum ('pending', 'connected', 'declined');
create type lobby.intro_status as enum ('pending', 'accepted', 'declined', 'cancelled');

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------

-- profiles: 1:1 con auth.users
create table lobby.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role lobby.user_role not null default 'member',
  display_name text,
  headline text,
  spotlight text,
  offer text[] not null default '{}',
  seek text[] not null default '{}',
  company text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table lobby.profiles is 'Profilo membro Lobby; visibile ad altri solo se presente+visibile nella stessa room e non bloccato.';
comment on column lobby.profiles.offer is 'Cosa il membro offre (tag).';
comment on column lobby.profiles.seek is 'Cosa il membro cerca (tag).';

create table lobby.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- venue_staff: staff/admin con scope sul singolo venue
create table lobby.venue_staff (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references lobby.venues (id) on delete cascade,
  profile_id uuid not null references lobby.profiles (id) on delete cascade,
  staff_role lobby.user_role not null default 'staff'
    check (staff_role in ('staff', 'admin')),
  created_at timestamptz not null default now(),
  unique (venue_id, profile_id)
);

-- memberships: il sigillo lo emette il VENUE, mai l'utente
create table lobby.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references lobby.profiles (id) on delete cascade,
  venue_id uuid not null references lobby.venues (id) on delete cascade,
  since date not null default (timezone('utc', now()))::date,
  verified_status lobby.verification_status not null default 'pending',
  seal_issued_at timestamptz,
  seal_issued_by uuid references lobby.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, venue_id),
  constraint memberships_seal_requires_verified check (
    seal_issued_at is null
    or verified_status = 'verified'
  )
);

comment on column lobby.memberships.seal_issued_by is 'Staff/admin del venue che ha emesso il sigillo (server-side).';

create table lobby.rooms (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references lobby.venues (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (venue_id, name)
);

-- presence: opt-in; invisibile di default; decade via visible_until / heartbeat
create table lobby.presence (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references lobby.profiles (id) on delete cascade,
  room_id uuid not null references lobby.rooms (id) on delete cascade,
  is_visible boolean not null default false,
  visible_until timestamptz,
  last_heartbeat timestamptz not null default now(),
  entered_at timestamptz not null default now(),
  unique (profile_id)
);

comment on table lobby.presence is 'Una sola room attiva per profilo. Default invisibile. Uscire = cancellare la riga o azzerare la visibilità.';
comment on column lobby.presence.is_visible is 'Visibilità opt-in; false di default (regola di prodotto).';

-- blocks: invisibilità selettiva (persona o azienda)
create table lobby.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references lobby.profiles (id) on delete cascade,
  blocked_profile_id uuid references lobby.profiles (id) on delete cascade,
  blocked_company text,
  created_at timestamptz not null default now(),
  constraint blocks_target_xor check (
    (blocked_profile_id is not null and blocked_company is null)
    or (blocked_profile_id is null and blocked_company is not null)
  ),
  constraint blocks_not_self check (
    blocked_profile_id is null or blocked_profile_id <> blocker_id
  )
);

create unique index blocks_person_uidx
  on lobby.blocks (blocker_id, blocked_profile_id)
  where blocked_profile_id is not null;

create unique index blocks_company_uidx
  on lobby.blocks (blocker_id, lower(blocked_company))
  where blocked_company is not null;

create table lobby.matches (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references lobby.profiles (id) on delete cascade,
  profile_b_id uuid not null references lobby.profiles (id) on delete cascade,
  score numeric(5, 4) not null check (score >= 0 and score <= 1),
  reasons text[] not null default '{}',
  room_id uuid references lobby.rooms (id) on delete set null,
  computed_at timestamptz not null default now(),
  constraint matches_canonical_pair check (profile_a_id < profile_b_id)
);

create unique index matches_pair_room_uidx
  on lobby.matches (profile_a_id, profile_b_id, coalesce(room_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- signals: richiesta di contatto (rate-limit lato server)
create table lobby.signals (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references lobby.profiles (id) on delete cascade,
  to_profile_id uuid not null references lobby.profiles (id) on delete cascade,
  status lobby.signal_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint signals_not_self check (from_profile_id <> to_profile_id)
);

create unique index signals_pending_uidx
  on lobby.signals (from_profile_id, to_profile_id)
  where status = 'pending';

create unique index signals_connected_pair_uidx
  on lobby.signals (
    least(from_profile_id, to_profile_id),
    greatest(from_profile_id, to_profile_id)
  )
  where status = 'connected';

create table lobby.intros (
  id uuid primary key default gen_random_uuid(),
  introducer_id uuid not null references lobby.profiles (id) on delete cascade,
  profile_a_id uuid not null references lobby.profiles (id) on delete cascade,
  profile_b_id uuid not null references lobby.profiles (id) on delete cascade,
  message text,
  status lobby.intro_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint intros_canonical_pair check (profile_a_id < profile_b_id),
  constraint intros_introducer_distinct check (
    introducer_id <> profile_a_id and introducer_id <> profile_b_id
  )
);

-- projects: pitch pubblico; deck privato su richiesta / quando connessi
create table lobby.projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references lobby.profiles (id) on delete cascade,
  title text not null,
  public_pitch text not null,
  private_deck_url text,
  deck_requestable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column lobby.projects.private_deck_url is
  'Mai leggibile via Data API: la SELECT su questa colonna è revocata ad authenticated. Usare lobby.project_deck_url(id).';

-- chats: solo tra profili connessi reciprocamente
create table lobby.chats (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references lobby.profiles (id) on delete cascade,
  profile_b_id uuid not null references lobby.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chats_canonical_pair check (profile_a_id < profile_b_id),
  unique (profile_a_id, profile_b_id)
);

create table lobby.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references lobby.chats (id) on delete cascade,
  sender_id uuid not null references lobby.profiles (id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 8000),
  created_at timestamptz not null default now()
);

create index messages_chat_created_idx on lobby.messages (chat_id, created_at);

-- member_access: perk / accessi riservati legati a una membership
create table lobby.member_access (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references lobby.memberships (id) on delete cascade,
  access_key text not null,
  label text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (membership_id, access_key)
);

-- ---------------------------------------------------------------------------
-- Indici
-- ---------------------------------------------------------------------------
create index profiles_company_lower_idx on lobby.profiles (lower(company));
create index memberships_venue_idx on lobby.memberships (venue_id);
create index memberships_profile_idx on lobby.memberships (profile_id);
create index rooms_venue_idx on lobby.rooms (venue_id);
create index presence_room_idx on lobby.presence (room_id);
create index presence_visible_room_idx on lobby.presence (room_id)
  where is_visible = true;
create index signals_to_idx on lobby.signals (to_profile_id, status);
create index signals_from_created_idx on lobby.signals (from_profile_id, created_at);
create index matches_a_idx on lobby.matches (profile_a_id);
create index matches_b_idx on lobby.matches (profile_b_id);
create index projects_profile_idx on lobby.projects (profile_id);
create index venue_staff_profile_idx on lobby.venue_staff (profile_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function lobby_private.set_updated_at()
returns trigger
language plpgsql
set search_path = lobby, pg_temp
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

create trigger profiles_set_updated_at
  before update on lobby.profiles
  for each row execute function lobby_private.set_updated_at();

create trigger venues_set_updated_at
  before update on lobby.venues
  for each row execute function lobby_private.set_updated_at();

create trigger memberships_set_updated_at
  before update on lobby.memberships
  for each row execute function lobby_private.set_updated_at();

create trigger projects_set_updated_at
  before update on lobby.projects
  for each row execute function lobby_private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profilo automatico alla registrazione
--
-- ATTENZIONE: auth.users è condiviso con Mediplan e Rank AI su questo progetto.
-- Questo trigger crea una riga lobby.profiles per OGNI nuovo utente del progetto,
-- inclusi quelli che si registrano su Mediplan o Rank AI.
-- Il profilo resta invisibile a chiunque finché non esiste una presence visibile,
-- quindi non espone nulla: sono righe in più, non un problema di privacy.
--
-- Filtrare su raw_user_meta_data->>'app' NON è una soluzione: quel campo si può
-- impostare su signUp() con email, ma su signInWithOAuth() (Google, LinkedIn) i
-- metadata arrivano dal provider e il marker non ci sarebbe. Un filtro del genere
-- lascerebbe senza profilo chi entra con OAuth, cioè romperebbe il login social.
-- Il trigger resta quindi incondizionato di proposito.
-- ---------------------------------------------------------------------------
create or replace function lobby_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
begin
  insert into lobby.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

create trigger on_auth_user_created_lobby
  after insert on auth.users
  for each row execute function lobby_private.handle_new_user();
