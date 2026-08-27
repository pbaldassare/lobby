-- Lobby RLS core — default deny; mutazioni del sigillo bloccate lato client via trigger.

alter table lobby.profiles enable row level security;
alter table lobby.venues enable row level security;
alter table lobby.venue_staff enable row level security;
alter table lobby.memberships enable row level security;
alter table lobby.rooms enable row level security;
alter table lobby.presence enable row level security;
alter table lobby.blocks enable row level security;
alter table lobby.matches enable row level security;
alter table lobby.signals enable row level security;
alter table lobby.intros enable row level security;
alter table lobby.projects enable row level security;
alter table lobby.chats enable row level security;
alter table lobby.messages enable row level security;
alter table lobby.member_access enable row level security;

alter table lobby.profiles force row level security;
alter table lobby.venues force row level security;
alter table lobby.venue_staff force row level security;
alter table lobby.memberships force row level security;
alter table lobby.rooms force row level security;
alter table lobby.presence force row level security;
alter table lobby.blocks force row level security;
alter table lobby.matches force row level security;
alter table lobby.signals force row level security;
alter table lobby.intros force row level security;
alter table lobby.projects force row level security;
alter table lobby.chats force row level security;
alter table lobby.messages force row level security;
alter table lobby.member_access force row level security;

create policy profiles_select_own_or_discoverable
  on lobby.profiles for select to authenticated
  using (
    id = auth.uid()
    or lobby_private.can_discover(auth.uid(), id)
    or exists (
      select 1 from lobby.memberships m
      where m.profile_id = profiles.id
        and lobby_private.is_venue_staff(m.venue_id, auth.uid())
    )
  );

create policy profiles_insert_own
  on lobby.profiles for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on lobby.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function lobby_private.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role changes are server-side only';
  end if;
  return new;
end;
$fn$;

create trigger profiles_prevent_role_escalation
  before update of role on lobby.profiles
  for each row execute function lobby_private.prevent_profile_role_escalation();

create policy venues_select_authenticated
  on lobby.venues for select to authenticated
  using (true);

create policy venue_staff_select_own_or_admin
  on lobby.venue_staff for select to authenticated
  using (
    profile_id = auth.uid()
    or lobby_private.is_venue_staff(venue_id, auth.uid())
  );

create policy memberships_select_own_or_venue_staff
  on lobby.memberships for select to authenticated
  using (
    profile_id = auth.uid()
    or lobby_private.is_venue_staff(venue_id, auth.uid())
  );

create policy memberships_insert_own_pending
  on lobby.memberships for insert to authenticated
  with check (
    profile_id = auth.uid()
    and verified_status = 'pending'
    and seal_issued_at is null
    and seal_issued_by is null
  );

create policy memberships_update_venue_staff_verify
  on lobby.memberships for update to authenticated
  using (lobby_private.is_venue_staff(venue_id, auth.uid()))
  with check (lobby_private.is_venue_staff(venue_id, auth.uid()));

create or replace function lobby_private.prevent_client_seal_mutation()
returns trigger
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
begin
  if auth.role() <> 'service_role' then
    if new.seal_issued_at is distinct from old.seal_issued_at
       or new.seal_issued_by is distinct from old.seal_issued_by then
      raise exception 'seal issuance is server-side only';
    end if;
  end if;
  return new;
end;
$fn$;

create trigger memberships_prevent_client_seal
  before update on lobby.memberships
  for each row execute function lobby_private.prevent_client_seal_mutation();

create policy rooms_select_authenticated
  on lobby.rooms for select to authenticated
  using (true);

create policy rooms_insert_venue_staff
  on lobby.rooms for insert to authenticated
  with check (lobby_private.is_venue_staff(venue_id, auth.uid()));

create policy rooms_update_venue_staff
  on lobby.rooms for update to authenticated
  using (lobby_private.is_venue_staff(venue_id, auth.uid()))
  with check (lobby_private.is_venue_staff(venue_id, auth.uid()));

create policy rooms_delete_venue_staff
  on lobby.rooms for delete to authenticated
  using (lobby_private.is_venue_staff(venue_id, auth.uid()));

create policy presence_select_own_discoverable_or_staff
  on lobby.presence for select to authenticated
  using (
    profile_id = auth.uid()
    or (
      is_visible = true
      and lobby_private.presence_is_live(presence)
      and (visible_until is null or visible_until > now())
      and exists (
        select 1 from lobby.presence me
        where me.profile_id = auth.uid()
          and me.room_id = presence.room_id
          and me.is_visible = true
          and lobby_private.presence_is_live(me)
          and (me.visible_until is null or me.visible_until > now())
      )
      and not lobby_private.is_blocked(auth.uid(), profile_id)
    )
    or exists (
      select 1 from lobby.rooms r
      where r.id = presence.room_id
        and lobby_private.is_venue_staff(r.venue_id, auth.uid())
    )
  );

create policy presence_insert_own
  on lobby.presence for insert to authenticated
  with check (profile_id = auth.uid() and is_visible = false);

create policy presence_update_own
  on lobby.presence for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy presence_delete_own
  on lobby.presence for delete to authenticated
  using (profile_id = auth.uid());

create policy blocks_select_own
  on lobby.blocks for select to authenticated
  using (blocker_id = auth.uid());

create policy blocks_insert_own
  on lobby.blocks for insert to authenticated
  with check (blocker_id = auth.uid());

create policy blocks_delete_own
  on lobby.blocks for delete to authenticated
  using (blocker_id = auth.uid());

create policy matches_select_participant
  on lobby.matches for select to authenticated
  using (
    (profile_a_id = auth.uid() or profile_b_id = auth.uid())
    and not lobby_private.is_blocked(profile_a_id, profile_b_id)
  );

create policy signals_select_participant
  on lobby.signals for select to authenticated
  using (from_profile_id = auth.uid() or to_profile_id = auth.uid());

create policy signals_insert_own_from
  on lobby.signals for insert to authenticated
  with check (
    from_profile_id = auth.uid()
    and status = 'pending'
    and not lobby_private.is_blocked(from_profile_id, to_profile_id)
    and (
      select count(*)::int from lobby.signals s
      where s.from_profile_id = auth.uid()
        and s.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    ) < lobby_private.signal_daily_limit()
  );

create policy signals_update_recipient_or_sender_cancel
  on lobby.signals for update to authenticated
  using (to_profile_id = auth.uid() or from_profile_id = auth.uid())
  with check (
    (to_profile_id = auth.uid() and status in ('connected', 'declined'))
    or (from_profile_id = auth.uid() and status = 'declined')
  );
