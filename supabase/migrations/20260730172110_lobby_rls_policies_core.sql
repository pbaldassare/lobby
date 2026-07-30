-- Lobby RLS core (applied remotely as lobby_rls_policies_core)
-- Default deny; seal mutations blocked for non-service_role via trigger.

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_staff enable row level security;
alter table public.memberships enable row level security;
alter table public.rooms enable row level security;
alter table public.presence enable row level security;
alter table public.blocks enable row level security;
alter table public.matches enable row level security;
alter table public.signals enable row level security;
alter table public.intros enable row level security;
alter table public.projects enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.member_access enable row level security;
alter table public.project_private_decks enable row level security;

alter table public.profiles force row level security;
alter table public.venues force row level security;
alter table public.venue_staff force row level security;
alter table public.memberships force row level security;
alter table public.rooms force row level security;
alter table public.presence force row level security;
alter table public.blocks force row level security;
alter table public.matches force row level security;
alter table public.signals force row level security;
alter table public.intros force row level security;
alter table public.projects force row level security;
alter table public.chats force row level security;
alter table public.messages force row level security;
alter table public.member_access force row level security;
alter table public.project_private_decks force row level security;

create policy profiles_select_own_or_discoverable
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or private.can_discover(auth.uid(), id)
    or exists (
      select 1 from public.memberships m
      where m.profile_id = profiles.id
        and private.is_venue_staff(m.venue_id, auth.uid())
    )
  );

create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function private.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role changes are server-side only';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update of role on public.profiles
  for each row execute function private.prevent_profile_role_escalation();

create policy venues_select_authenticated
  on public.venues for select to authenticated
  using (true);

create policy venue_staff_select_own_or_admin
  on public.venue_staff for select to authenticated
  using (
    profile_id = auth.uid()
    or private.is_venue_staff(venue_id, auth.uid())
  );

create policy memberships_select_own_or_venue_staff
  on public.memberships for select to authenticated
  using (
    profile_id = auth.uid()
    or private.is_venue_staff(venue_id, auth.uid())
  );

create policy memberships_insert_own_pending
  on public.memberships for insert to authenticated
  with check (
    profile_id = auth.uid()
    and verified_status = 'pending'
    and seal_issued_at is null
    and seal_issued_by is null
  );

create policy memberships_update_venue_staff_verify
  on public.memberships for update to authenticated
  using (private.is_venue_staff(venue_id, auth.uid()))
  with check (private.is_venue_staff(venue_id, auth.uid()));

create or replace function private.prevent_client_seal_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if new.seal_issued_at is distinct from old.seal_issued_at
       or new.seal_issued_by is distinct from old.seal_issued_by then
      raise exception 'seal issuance is server-side only';
    end if;
  end if;
  return new;
end;
$$;

create trigger memberships_prevent_client_seal
  before update on public.memberships
  for each row execute function private.prevent_client_seal_mutation();

create policy rooms_select_authenticated
  on public.rooms for select to authenticated
  using (true);

create policy rooms_insert_venue_staff
  on public.rooms for insert to authenticated
  with check (private.is_venue_staff(venue_id, auth.uid()));

create policy rooms_update_venue_staff
  on public.rooms for update to authenticated
  using (private.is_venue_staff(venue_id, auth.uid()))
  with check (private.is_venue_staff(venue_id, auth.uid()));

create policy rooms_delete_venue_staff
  on public.rooms for delete to authenticated
  using (private.is_venue_staff(venue_id, auth.uid()));

create policy presence_select_own_discoverable_or_staff
  on public.presence for select to authenticated
  using (
    profile_id = auth.uid()
    or (
      is_visible = true
      and private.presence_is_live(presence)
      and (visible_until is null or visible_until > now())
      and exists (
        select 1 from public.presence me
        where me.profile_id = auth.uid()
          and me.room_id = presence.room_id
          and me.is_visible = true
          and private.presence_is_live(me)
          and (me.visible_until is null or me.visible_until > now())
      )
      and not private.is_blocked(auth.uid(), profile_id)
    )
    or exists (
      select 1 from public.rooms r
      where r.id = presence.room_id
        and private.is_venue_staff(r.venue_id, auth.uid())
    )
  );

create policy presence_insert_own
  on public.presence for insert to authenticated
  with check (profile_id = auth.uid() and is_visible = false);

create policy presence_update_own
  on public.presence for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy presence_delete_own
  on public.presence for delete to authenticated
  using (profile_id = auth.uid());

create policy blocks_select_own
  on public.blocks for select to authenticated
  using (blocker_id = auth.uid());

create policy blocks_insert_own
  on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());

create policy blocks_delete_own
  on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

create policy matches_select_participant
  on public.matches for select to authenticated
  using (
    (profile_a_id = auth.uid() or profile_b_id = auth.uid())
    and not private.is_blocked(profile_a_id, profile_b_id)
  );

create policy signals_select_participant
  on public.signals for select to authenticated
  using (from_profile_id = auth.uid() or to_profile_id = auth.uid());

create policy signals_insert_own_from
  on public.signals for insert to authenticated
  with check (
    from_profile_id = auth.uid()
    and status = 'pending'
    and not private.is_blocked(from_profile_id, to_profile_id)
    and (
      select count(*)::int from public.signals s
      where s.from_profile_id = auth.uid()
        and s.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    ) < private.signal_daily_limit()
  );

create policy signals_update_recipient_or_sender_cancel
  on public.signals for update to authenticated
  using (to_profile_id = auth.uid() or from_profile_id = auth.uid())
  with check (
    (to_profile_id = auth.uid() and status in ('connected', 'declined'))
    or (from_profile_id = auth.uid() and status = 'declined')
  );
