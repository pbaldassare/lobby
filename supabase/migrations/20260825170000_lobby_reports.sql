-- Lobby: segnalazioni di moderazione.
-- Colma la tabella che apps/backoffice/lib/actions/{moderation,stats}.ts già interrogava
-- e che nessuna migration creava (il codice degradava con "Reports table not available yet").
-- Forma allineata al tipo `Report` in packages/shared/src/types/index.ts.

create type lobby.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table lobby.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references lobby.profiles (id) on delete cascade,
  reported_profile_id uuid references lobby.profiles (id) on delete set null,
  venue_id uuid references lobby.venues (id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 200),
  details text check (details is null or char_length(details) <= 4000),
  status lobby.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references lobby.profiles (id) on delete set null,
  constraint reports_not_self check (
    reported_profile_id is null or reported_profile_id <> reporter_id
  ),
  constraint reports_resolution_consistent check (
    (status in ('open', 'reviewing') and resolved_at is null and resolved_by is null)
    or (status in ('resolved', 'dismissed') and resolved_at is not null)
  )
);

comment on table lobby.reports is
  'Segnalazioni di moderazione. Le chiude lo staff del venue dal back-office (service_role).';

create index reports_venue_status_idx on lobby.reports (venue_id, status);
create index reports_reporter_idx on lobby.reports (reporter_id);
create index reports_reported_idx on lobby.reports (reported_profile_id);

alter table lobby.reports enable row level security;
alter table lobby.reports force row level security;

-- Chi segnala vede solo le proprie; lo staff vede quelle del proprio venue.
create policy reports_select_reporter_or_venue_staff
  on lobby.reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or (
      venue_id is not null
      and lobby_private.is_venue_staff(venue_id, auth.uid())
    )
  );

-- Si apre una segnalazione per sé, sempre in stato 'open' e mai già risolta.
create policy reports_insert_own_open
  on lobby.reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and status = 'open'
    and resolved_at is null
    and resolved_by is null
  );

-- Solo lo staff del venue cambia stato.
create policy reports_update_venue_staff
  on lobby.reports for update to authenticated
  using (
    venue_id is not null
    and lobby_private.is_venue_staff(venue_id, auth.uid())
  )
  with check (
    venue_id is not null
    and lobby_private.is_venue_staff(venue_id, auth.uid())
  );

-- Nessuna policy di DELETE: le segnalazioni non si cancellano dal client.

grant select, insert, update on lobby.reports to authenticated;
revoke all on lobby.reports from anon;
