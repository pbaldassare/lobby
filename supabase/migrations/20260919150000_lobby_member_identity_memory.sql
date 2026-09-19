-- Identità membro nel DB Lobby + memoria privata di stanze e persone viste.
-- LinkedIn e CV alimentano il nostro profilo: dopo l'import non dipendiamo dal provider.
-- Lo storico è uno snapshot privato: non è presence live e non è visibile ad altri.

alter table lobby.profiles
  add column if not exists occupation text,
  add column if not exists hobbies text[] not null default '{}',
  add column if not exists linkedin_url text;

comment on column lobby.profiles.occupation is
  'Occupazione dichiarata dal membro; vive nel DB Lobby, non è una query live a LinkedIn.';
comment on column lobby.profiles.hobbies is 'Hobby dichiarati (tag).';
comment on column lobby.profiles.linkedin_url is
  'URL pubblico LinkedIn scelto dal membro. Opzionale; non sostituisce il profilo Lobby.';

create table if not exists lobby.linkedin_links (
  profile_id uuid primary key references lobby.profiles (id) on delete cascade,
  subject text not null,
  imported_at timestamptz not null default now(),
  imported_name text,
  imported_headline text,
  imported_picture_url text,
  source text not null default 'oidc',
  created_at timestamptz not null default now()
);

comment on table lobby.linkedin_links is
  'Esito dell''import one-shot da LinkedIn. Dopo imported_at il profilo vive solo in Lobby.';

create table if not exists lobby.documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references lobby.profiles (id) on delete cascade,
  kind text not null check (kind in ('cv', 'other')),
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size integer,
  created_at timestamptz not null default now()
);

create unique index if not exists documents_one_cv_uidx
  on lobby.documents (profile_id)
  where kind = 'cv';

comment on table lobby.documents is
  'Metadati file (CV). Il contenuto è in storage lobby-docs. Condivisione solo a connessione reciproca.';

alter table lobby.projects
  add column if not exists role_title text,
  add column if not exists status text not null default 'active',
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_visible boolean not null default true;

do $chk$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_status_check'
      and conrelid = 'lobby.projects'::regclass
  ) then
    alter table lobby.projects
      add constraint projects_status_check
      check (status in ('active', 'paused', 'shipped'));
  end if;
end
$chk$;

create table if not exists lobby.room_visits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references lobby.profiles (id) on delete cascade,
  room_id uuid not null references lobby.rooms (id) on delete cascade,
  venue_id uuid references lobby.venues (id) on delete set null,
  room_name text not null,
  venue_name text,
  entered_at timestamptz not null default now(),
  left_at timestamptz
);

create unique index if not exists room_visits_open_uidx
  on lobby.room_visits (profile_id)
  where left_at is null;

create index if not exists room_visits_profile_entered_idx
  on lobby.room_visits (profile_id, entered_at desc);

comment on table lobby.room_visits is
  'Storico privato delle stanze visitate. Solo il visitatore legge. left_at null = visita aperta.';

create table if not exists lobby.encounters (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references lobby.profiles (id) on delete cascade,
  room_visit_id uuid not null references lobby.room_visits (id) on delete cascade,
  seen_profile_id uuid not null references lobby.profiles (id) on delete cascade,
  snapshot_name text,
  snapshot_headline text,
  snapshot_company text,
  snapshot_occupation text,
  seen_at timestamptz not null default now(),
  constraint encounters_not_self check (visitor_id <> seen_profile_id),
  unique (visitor_id, seen_profile_id, room_visit_id)
);

create index if not exists encounters_visitor_seen_idx
  on lobby.encounters (visitor_id, seen_at desc);

comment on table lobby.encounters is
  'Persone viste: snapshot al momento dell''incontro. Non è un profilo live. Solo il visitatore legge.';
