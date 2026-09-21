-- Anteprima promozionale della stanza (testo IA, fatti del venue).
-- Solo staff/admin del locale: i membri non la leggono.

create table if not exists lobby.room_promos (
  room_id uuid primary key references lobby.rooms (id) on delete cascade,
  venue_id uuid not null references lobby.venues (id) on delete cascade,
  headline text not null,
  lede text not null,
  about_lobby text not null,
  purpose text not null,
  how_to_enter text not null,
  privacy_note text not null,
  cta text not null,
  schedule_line text not null,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_promos_headline_len check (char_length(headline) between 1 and 160),
  constraint room_promos_lede_len check (char_length(lede) between 1 and 400),
  constraint room_promos_about_len check (char_length(about_lobby) between 1 and 600),
  constraint room_promos_purpose_len check (char_length(purpose) between 1 and 600),
  constraint room_promos_enter_len check (char_length(how_to_enter) between 1 and 600),
  constraint room_promos_privacy_len check (char_length(privacy_note) between 1 and 400),
  constraint room_promos_cta_len check (char_length(cta) between 1 and 120)
);

comment on table lobby.room_promos is
  'Copy promozionale della stanza per poster/ingresso. Scritta dallo staff, mai visibile ai membri via Data API se non staff.';

create index if not exists room_promos_venue_id_idx on lobby.room_promos (venue_id);

alter table lobby.room_promos enable row level security;
alter table lobby.room_promos force row level security;

create policy room_promos_select_staff
  on lobby.room_promos for select to authenticated
  using (
    lobby_private.is_venue_staff(venue_id, auth.uid())
    or exists (
      select 1 from lobby.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy room_promos_write_staff
  on lobby.room_promos for insert to authenticated
  with check (
    lobby_private.is_venue_staff(venue_id, auth.uid())
    or exists (
      select 1 from lobby.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy room_promos_update_staff
  on lobby.room_promos for update to authenticated
  using (
    lobby_private.is_venue_staff(venue_id, auth.uid())
    or exists (
      select 1 from lobby.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    lobby_private.is_venue_staff(venue_id, auth.uid())
    or exists (
      select 1 from lobby.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

grant select, insert, update on lobby.room_promos to authenticated;
grant all on lobby.room_promos to service_role;
