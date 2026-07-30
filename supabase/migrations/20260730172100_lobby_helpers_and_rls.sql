-- Lobby: privacy helpers + RLS (default deny)
-- Profile visibility: same room + both visible + heartbeat fresh + not blocked.

-- ---------------------------------------------------------------------------
-- Constants / helpers (SECURITY DEFINER in private schema)
-- ---------------------------------------------------------------------------

-- Heartbeat TTL: presence considered live if heartbeat within this window
create or replace function private.presence_ttl()
returns interval
language sql
immutable
as $$ select interval '90 seconds' $$;

create or replace function private.signal_daily_limit()
returns integer
language sql
immutable
as $$ select 10 $$;

create or replace function private.uid()
returns uuid
language sql
stable
as $$ select auth.uid() $$;

-- Blocker hid from target person OR from target's company (either direction)
create or replace function private.is_blocked(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks b
    where
      (
        b.blocker_id = viewer
        and (
          b.blocked_profile_id = target
          or (
            b.blocked_company is not null
            and exists (
              select 1 from public.profiles p
              where p.id = target
                and p.company is not null
                and lower(p.company) = lower(b.blocked_company)
            )
          )
        )
      )
      or (
        b.blocker_id = target
        and (
          b.blocked_profile_id = viewer
          or (
            b.blocked_company is not null
            and exists (
              select 1 from public.profiles p
              where p.id = viewer
                and p.company is not null
                and lower(p.company) = lower(b.blocked_company)
            )
          )
        )
      )
  );
$$;

-- Active visible presence row
create or replace function private.presence_is_live(p public.presence)
returns boolean
language sql
stable
as $$
  select
    p.last_heartbeat > (now() - private.presence_ttl())
    and (
      not p.is_visible
      or p.visible_until is null
      or p.visible_until > now()
    );
$$;

-- Both profiles present AND visible in the same room (product discovery rule)
create or replace function private.share_visible_room(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.presence pv
    join public.presence pt on pt.room_id = pv.room_id
    where pv.profile_id = viewer
      and pt.profile_id = target
      and pv.is_visible = true
      and pt.is_visible = true
      and private.presence_is_live(pv)
      and private.presence_is_live(pt)
      and (pv.visible_until is null or pv.visible_until > now())
      and (pt.visible_until is null or pt.visible_until > now())
  );
$$;

-- Mutual consent connection
create or replace function private.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.signals s
    where s.status = 'connected'
      and (
        (s.from_profile_id = a and s.to_profile_id = b)
        or (s.from_profile_id = b and s.to_profile_id = a)
      )
  );
$$;

create or replace function private.is_venue_staff(p_venue_id uuid, p_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.venue_staff vs
    where vs.venue_id = p_venue_id
      and vs.profile_id = p_profile_id
  );
$$;

create or replace function private.is_chat_participant(p_chat_id uuid, p_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chats c
    where c.id = p_chat_id
      and (c.profile_a_id = p_profile_id or c.profile_b_id = p_profile_id)
  );
$$;

-- Discovery visibility: same room visible + not blocked
create or replace function private.can_discover(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    viewer is not null
    and target is not null
    and viewer <> target
    and private.share_visible_room(viewer, target)
    and not private.is_blocked(viewer, target);
$$;

-- Public wrappers for clients / RLS (stable, security definer)
create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select private.are_connected(a, b) $$;

create or replace function public.can_discover_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select private.can_discover(auth.uid(), target) $$;

create or replace function public.is_venue_staff(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select private.is_venue_staff(p_venue_id, auth.uid()) $$;

revoke all on function public.are_connected(uuid, uuid) from public;
revoke all on function public.can_discover_profile(uuid) from public;
revoke all on function public.is_venue_staff(uuid) from public;
grant execute on function public.are_connected(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_discover_profile(uuid) to authenticated, service_role;
grant execute on function public.is_venue_staff(uuid) to authenticated, service_role;

-- Ensure chat exists when a signal becomes connected
create or replace function private.ensure_chat_on_connect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a uuid;
  b uuid;
begin
  if new.status = 'connected' and (tg_op = 'INSERT' or old.status is distinct from 'connected') then
    a := least(new.from_profile_id, new.to_profile_id);
    b := greatest(new.from_profile_id, new.to_profile_id);
    insert into public.chats (profile_a_id, profile_b_id)
    values (a, b)
    on conflict (profile_a_id, profile_b_id) do nothing;
    new.responded_at := coalesce(new.responded_at, now());
  end if;
  return new;
end;
$$;

create trigger signals_ensure_chat
  before insert or update of status on public.signals
  for each row execute function private.ensure_chat_on_connect();

-- Leave room: clearing visibility when visible_until passes is client/edge responsibility;
-- helper to expire own visibility
create or replace function public.heartbeat_presence(p_visible boolean default null, p_visible_until timestamptz default null)
returns public.presence
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.presence;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.presence
  set
    last_heartbeat = now(),
    is_visible = coalesce(p_visible, is_visible),
    visible_until = case
      when p_visible is false then null
      else coalesce(p_visible_until, visible_until)
    end
  where profile_id = auth.uid()
  returning * into row;

  if row.id is null then
    raise exception 'no presence row';
  end if;

  return row;
end;
$$;

revoke all on function public.heartbeat_presence(boolean, timestamptz) from public;
grant execute on function public.heartbeat_presence(boolean, timestamptz) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS on EVERY table (default deny)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_own_or_discoverable
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or private.can_discover(auth.uid(), id)
    or exists (
      -- venue staff may see members of their venues (verification)
      select 1
      from public.memberships m
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
  with check (
    id = auth.uid()
    -- role changes are server-side only
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- venues
-- ---------------------------------------------------------------------------
create policy venues_select_authenticated
  on public.venues for select to authenticated
  using (true);

-- writes via service_role / back-office only (no insert/update/delete for authenticated)

-- ---------------------------------------------------------------------------
-- venue_staff
-- ---------------------------------------------------------------------------
create policy venue_staff_select_own_or_admin
  on public.venue_staff for select to authenticated
  using (
    profile_id = auth.uid()
    or private.is_venue_staff(venue_id, auth.uid())
  );

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
create policy memberships_select_own_or_venue_staff
  on public.memberships for select to authenticated
  using (
    profile_id = auth.uid()
    or private.is_venue_staff(venue_id, auth.uid())
  );

-- Member may request membership (pending); seal fields must stay null
create policy memberships_insert_own_pending
  on public.memberships for insert to authenticated
  with check (
    profile_id = auth.uid()
    and verified_status = 'pending'
    and seal_issued_at is null
    and seal_issued_by is null
  );

-- Venue staff may update verification (not seal — seal via issue-seal edge fn / service_role)
create policy memberships_update_venue_staff_verify
  on public.memberships for update to authenticated
  using (private.is_venue_staff(venue_id, auth.uid()))
  with check (
    private.is_venue_staff(venue_id, auth.uid())
    and seal_issued_at is not distinct from (
      select m.seal_issued_at from public.memberships m where m.id = memberships.id
    )
    and seal_issued_by is not distinct from (
      select m.seal_issued_by from public.memberships m where m.id = memberships.id
    )
  );

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- presence
-- ---------------------------------------------------------------------------
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
      select 1
      from public.rooms r
      where r.id = presence.room_id
        and private.is_venue_staff(r.venue_id, auth.uid())
    )
  );

create policy presence_insert_own
  on public.presence for insert to authenticated
  with check (
    profile_id = auth.uid()
    and is_visible = false -- invisible by default on enter
  );

create policy presence_update_own
  on public.presence for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy presence_delete_own
  on public.presence for delete to authenticated
  using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- blocks
-- ---------------------------------------------------------------------------
create policy blocks_select_own
  on public.blocks for select to authenticated
  using (blocker_id = auth.uid());

create policy blocks_insert_own
  on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());

create policy blocks_delete_own
  on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- matches (written by compute-matches edge fn / service_role)
-- ---------------------------------------------------------------------------
create policy matches_select_participant
  on public.matches for select to authenticated
  using (
    (profile_a_id = auth.uid() or profile_b_id = auth.uid())
    and not private.is_blocked(profile_a_id, profile_b_id)
  );

-- ---------------------------------------------------------------------------
-- signals
-- ---------------------------------------------------------------------------
create policy signals_select_participant
  on public.signals for select to authenticated
  using (
    from_profile_id = auth.uid()
    or to_profile_id = auth.uid()
  );

-- Prefer send-signal edge function; keep tight client insert as defense-in-depth
create policy signals_insert_own_from
  on public.signals for insert to authenticated
  with check (
    from_profile_id = auth.uid()
    and status = 'pending'
    and not private.is_blocked(from_profile_id, to_profile_id)
    and (
      select count(*)::int
      from public.signals s
      where s.from_profile_id = auth.uid()
        and s.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    ) < private.signal_daily_limit()
  );

create policy signals_update_recipient_or_sender_cancel
  on public.signals for update to authenticated
  using (
    to_profile_id = auth.uid()
    or from_profile_id = auth.uid()
  )
  with check (
    (
      to_profile_id = auth.uid()
      and status in ('connected', 'declined')
    )
    or (
      from_profile_id = auth.uid()
      and status = 'declined'
    )
  );

-- ---------------------------------------------------------------------------
-- intros
-- ---------------------------------------------------------------------------
create policy intros_select_involved
  on public.intros for select to authenticated
  using (
    introducer_id = auth.uid()
    or profile_a_id = auth.uid()
    or profile_b_id = auth.uid()
  );

create policy intros_insert_introducer_connected
  on public.intros for insert to authenticated
  with check (
    introducer_id = auth.uid()
    and private.are_connected(introducer_id, profile_a_id)
    and private.are_connected(introducer_id, profile_b_id)
    and not private.is_blocked(profile_a_id, profile_b_id)
  );

create policy intros_update_involved
  on public.intros for update to authenticated
  using (
    introducer_id = auth.uid()
    or profile_a_id = auth.uid()
    or profile_b_id = auth.uid()
  )
  with check (
    introducer_id = auth.uid()
    or profile_a_id = auth.uid()
    or profile_b_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create policy projects_select_own_discoverable_or_connected
  on public.projects for select to authenticated
  using (
    profile_id = auth.uid()
    or private.can_discover(auth.uid(), profile_id)
    or private.are_connected(auth.uid(), profile_id)
  );

-- Restrict private_deck_url via column privilege: revoke from authenticated, grant select on safe cols
-- (PostgREST still returns null for revoked columns when using SELECT *)
revoke select on public.projects from authenticated;
grant select (
  id, profile_id, title, public_pitch, deck_requestable, created_at, updated_at
) on public.projects to authenticated;
grant select (private_deck_url) on public.projects to service_role;

-- Connected peers need deck: use a security-invoker view
create or replace view public.project_decks
with (security_invoker = true)
as
select
  p.id as project_id,
  p.profile_id,
  p.private_deck_url
from public.projects p
where
  p.private_deck_url is not null
  and (
    p.profile_id = auth.uid()
    or private.are_connected(auth.uid(), p.profile_id)
  );

grant select on public.project_decks to authenticated;

create policy projects_insert_own
  on public.projects for insert to authenticated
  with check (profile_id = auth.uid());

create policy projects_update_own
  on public.projects for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy projects_delete_own
  on public.projects for delete to authenticated
  using (profile_id = auth.uid());

-- Re-grant DML column access for own CRUD
grant insert, update, delete on public.projects to authenticated;
grant select (
  id, profile_id, title, public_pitch, private_deck_url, deck_requestable, created_at, updated_at
) on public.projects to authenticated;

-- Note: private_deck_url readable via project_decks when connected; table SELECT still
-- allows owner to read own deck through projects_select policy + column grant above.
-- Non-owners see deck URL only through project_decks view OR if discoverable —
-- tighten: drop private_deck_url from broad grant and keep owner path via view + own policy.
revoke select (private_deck_url) on public.projects from authenticated;
grant select (private_deck_url) on public.projects to authenticated; -- owner needs it; RLS alone can't hide columns
-- Column-level cannot differ by row; use view for peers. Owners use projects table via RLS.
-- For non-owners selecting projects, private_deck_url may still leak if granted.
-- Final approach: keep private_deck_url revoked from authenticated on base table;
-- owners read deck via project_decks view (includes own).

revoke select (private_deck_url) on public.projects from authenticated;

-- ---------------------------------------------------------------------------
-- chats + messages (mutual consent only)
-- ---------------------------------------------------------------------------
create policy chats_select_participant
  on public.chats for select to authenticated
  using (
    profile_a_id = auth.uid() or profile_b_id = auth.uid()
  );

-- Chats created by trigger / service_role when signal connects — no client insert

create policy messages_select_participant
  on public.messages for select to authenticated
  using (private.is_chat_participant(chat_id, auth.uid()));

create policy messages_insert_sender_participant
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and private.is_chat_participant(chat_id, auth.uid())
    and exists (
      select 1 from public.chats c
      where c.id = chat_id
        and private.are_connected(c.profile_a_id, c.profile_b_id)
    )
  );

-- ---------------------------------------------------------------------------
-- member_access
-- ---------------------------------------------------------------------------
create policy member_access_select_owner_or_staff
  on public.member_access for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_access.membership_id
        and (
          m.profile_id = auth.uid()
          or private.is_venue_staff(m.venue_id, auth.uid())
        )
    )
  );

create policy member_access_write_venue_staff
  on public.member_access for insert to authenticated
  with check (
    exists (
      select 1 from public.memberships m
      where m.id = membership_id
        and private.is_venue_staff(m.venue_id, auth.uid())
        and m.verified_status = 'verified'
        and m.seal_issued_at is not null
    )
  );

create policy member_access_update_venue_staff
  on public.member_access for update to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_access.membership_id
        and private.is_venue_staff(m.venue_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.memberships m
      where m.id = membership_id
        and private.is_venue_staff(m.venue_id, auth.uid())
    )
  );

create policy member_access_delete_venue_staff
  on public.member_access for delete to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.id = member_access.membership_id
        and private.is_venue_staff(m.venue_id, auth.uid())
    )
  );

-- Grants (RLS still applies)
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.project_decks to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Tighten: anon gets nothing useful
revoke all on all tables in schema public from anon;
