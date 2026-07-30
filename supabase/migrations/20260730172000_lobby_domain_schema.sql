-- Lobby domain schema
-- Privacy-first: invisible by default; presence opt-in; seals issued by venue; RLS on every table.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Private schema for SECURITY DEFINER helpers (not exposed via Data API)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('member', 'staff', 'admin');
create type public.verification_status as enum ('pending', 'verified', 'rejected', 'revoked');
create type public.signal_status as enum ('pending', 'connected', 'declined');
create type public.intro_status as enum ('pending', 'accepted', 'declined', 'cancelled');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'member',
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

comment on table public.profiles is 'Lobby member profile; visible to others only when present+visible in same room and not blocked.';
comment on column public.profiles.offer is 'What the member offers (tags).';
comment on column public.profiles.seek is 'What the member seeks (tags).';

-- venues
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- venue_staff: staff/admin scoped to a venue (seal/verify only for own venue)
create table public.venue_staff (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  staff_role public.user_role not null default 'staff'
    check (staff_role in ('staff', 'admin')),
  created_at timestamptz not null default now(),
  unique (venue_id, profile_id)
);

-- memberships: seal issued by VENUE (not self-asserted)
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  since date not null default (timezone('utc', now()))::date,
  verified_status public.verification_status not null default 'pending',
  seal_issued_at timestamptz,
  seal_issued_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, venue_id),
  constraint memberships_seal_requires_verified check (
    seal_issued_at is null
    or verified_status = 'verified'
  )
);

comment on column public.memberships.seal_issued_by is 'Venue staff/admin who issued the seal (server-side).';

-- rooms within a venue
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (venue_id, name)
);

-- presence: opt-in; invisible by default; auto-off via visible_until / heartbeat
create table public.presence (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  is_visible boolean not null default false,
  visible_until timestamptz,
  last_heartbeat timestamptz not null default now(),
  entered_at timestamptz not null default now(),
  unique (profile_id)
);

comment on table public.presence is 'One active room per profile. Default invisible. Leave = delete row or clear visibility.';
comment on column public.presence.is_visible is 'Opt-in visibility; false by default (product rule).';

-- blocks: selective invisibility (person or company)
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_profile_id uuid references public.profiles (id) on delete cascade,
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
  on public.blocks (blocker_id, blocked_profile_id)
  where blocked_profile_id is not null;

create unique index blocks_company_uidx
  on public.blocks (blocker_id, lower(blocked_company))
  where blocked_company is not null;

-- matches: pair + score + why
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references public.profiles (id) on delete cascade,
  profile_b_id uuid not null references public.profiles (id) on delete cascade,
  score numeric(5, 4) not null check (score >= 0 and score <= 1),
  reasons text[] not null default '{}',
  room_id uuid references public.rooms (id) on delete set null,
  computed_at timestamptz not null default now(),
  constraint matches_canonical_pair check (profile_a_id < profile_b_id)
);

create unique index matches_pair_room_uidx
  on public.matches (profile_a_id, profile_b_id, coalesce(room_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- signals: contact request (rate-limited server-side)
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.signal_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint signals_not_self check (from_profile_id <> to_profile_id)
);

create unique index signals_pending_uidx
  on public.signals (from_profile_id, to_profile_id)
  where status = 'pending';

create unique index signals_connected_pair_uidx
  on public.signals (
    least(from_profile_id, to_profile_id),
    greatest(from_profile_id, to_profile_id)
  )
  where status = 'connected';

-- intros: introduction via mutual acquaintance
create table public.intros (
  id uuid primary key default gen_random_uuid(),
  introducer_id uuid not null references public.profiles (id) on delete cascade,
  profile_a_id uuid not null references public.profiles (id) on delete cascade,
  profile_b_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status public.intro_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint intros_canonical_pair check (profile_a_id < profile_b_id),
  constraint intros_introducer_distinct check (
    introducer_id <> profile_a_id and introducer_id <> profile_b_id
  )
);

-- projects: public pitch; private deck on request / when connected
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  public_pitch text not null,
  private_deck_url text,
  deck_requestable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- chats: only between mutually connected profiles
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references public.profiles (id) on delete cascade,
  profile_b_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chats_canonical_pair check (profile_a_id < profile_b_id),
  unique (profile_a_id, profile_b_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 8000),
  created_at timestamptz not null default now()
);

create index messages_chat_created_idx on public.messages (chat_id, created_at);

-- member_access: reserved perks / accesses for a membership
create table public.member_access (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  access_key text not null,
  label text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (membership_id, access_key)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index profiles_company_lower_idx on public.profiles (lower(company));
create index memberships_venue_idx on public.memberships (venue_id);
create index memberships_profile_idx on public.memberships (profile_id);
create index rooms_venue_idx on public.rooms (venue_id);
create index presence_room_idx on public.presence (room_id);
create index presence_visible_room_idx on public.presence (room_id)
  where is_visible = true;
create index signals_to_idx on public.signals (to_profile_id, status);
create index signals_from_created_idx on public.signals (from_profile_id, created_at);
create index matches_a_idx on public.matches (profile_a_id);
create index matches_b_idx on public.matches (profile_b_id);
create index projects_profile_idx on public.projects (profile_id);
create index venue_staff_profile_idx on public.venue_staff (profile_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function private.set_updated_at();

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

-- Auto-create profile on signup
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
