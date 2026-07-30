-- Lobby: Realtime for room presence + privileged SQL helpers used by Edge Functions

-- ---------------------------------------------------------------------------
-- Realtime: who is visible in the room now
-- ---------------------------------------------------------------------------
alter table public.presence replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'presence'
  ) then
    alter publication supabase_realtime add table public.presence;
  end if;
end;
$$;

-- Optional chat realtime (connected peers only via RLS)
alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileged RPCs (service_role / Edge Functions)
-- ---------------------------------------------------------------------------

-- issue_seal: venue staff issues membership seal (never self-issued by member)
create or replace function public.issue_seal(p_membership_id uuid, p_issuer_id uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.memberships;
begin
  select * into m from public.memberships where id = p_membership_id for update;
  if m.id is null then
    raise exception 'membership not found';
  end if;

  if not private.is_venue_staff(m.venue_id, p_issuer_id) then
    raise exception 'not venue staff for this venue';
  end if;

  update public.memberships
  set
    verified_status = 'verified',
    seal_issued_at = now(),
    seal_issued_by = p_issuer_id
  where id = p_membership_id
  returning * into m;

  return m;
end;
$$;

revoke all on function public.issue_seal(uuid, uuid) from public;
grant execute on function public.issue_seal(uuid, uuid) to service_role;

-- send_signal: rate-limited contact request
create or replace function public.send_signal(
  p_from uuid,
  p_to uuid,
  p_message text default null
)
returns public.signals
language plpgsql
security definer
set search_path = public
as $$
declare
  sent_today int;
  row public.signals;
begin
  if p_from is null or p_to is null or p_from = p_to then
    raise exception 'invalid signal participants';
  end if;

  if private.is_blocked(p_from, p_to) then
    raise exception 'blocked';
  end if;

  -- Prefer same-room visible discovery; still allow if already connected path is N/A for new signal
  if not private.can_discover(p_from, p_to) then
    raise exception 'not discoverable in shared visible room';
  end if;

  select count(*)::int into sent_today
  from public.signals s
  where s.from_profile_id = p_from
    and s.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  if sent_today >= private.signal_daily_limit() then
    raise exception 'daily signal limit reached (%)', private.signal_daily_limit();
  end if;

  if exists (
    select 1 from public.signals s
    where s.status = 'connected'
      and (
        (s.from_profile_id = p_from and s.to_profile_id = p_to)
        or (s.from_profile_id = p_to and s.to_profile_id = p_from)
      )
  ) then
    raise exception 'already connected';
  end if;

  if exists (
    select 1 from public.signals s
    where s.from_profile_id = p_from
      and s.to_profile_id = p_to
      and s.status = 'pending'
  ) then
    raise exception 'signal already pending';
  end if;

  insert into public.signals (from_profile_id, to_profile_id, status, message)
  values (p_from, p_to, 'pending', p_message)
  returning * into row;

  return row;
end;
$$;

revoke all on function public.send_signal(uuid, uuid, text) from public;
grant execute on function public.send_signal(uuid, uuid, text) to service_role;

-- compute_matches: offer/seek overlap for visible people in a room
create or replace function public.compute_matches_for_room(p_room_id uuid)
returns setof public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
  b record;
  overlap_offer_seek text[];
  overlap_seek_offer text[];
  reasons text[];
  score numeric(5, 4);
  inserted public.matches;
begin
  for a in
    select pr.profile_id, p.offer, p.seek
    from public.presence pr
    join public.profiles p on p.id = pr.profile_id
    where pr.room_id = p_room_id
      and pr.is_visible = true
      and private.presence_is_live(pr)
      and (pr.visible_until is null or pr.visible_until > now())
  loop
    for b in
      select pr.profile_id, p.offer, p.seek
      from public.presence pr
      join public.profiles p on p.id = pr.profile_id
      where pr.room_id = p_room_id
        and pr.profile_id > a.profile_id
        and pr.is_visible = true
        and private.presence_is_live(pr)
        and (pr.visible_until is null or pr.visible_until > now())
    loop
      if private.is_blocked(a.profile_id, b.profile_id) then
        continue;
      end if;

      overlap_offer_seek := (
        select coalesce(array_agg(x), '{}')
        from (
          select distinct unnest(a.offer) as x
          intersect
          select distinct unnest(b.seek)
        ) s
      );

      overlap_seek_offer := (
        select coalesce(array_agg(x), '{}')
        from (
          select distinct unnest(a.seek) as x
          intersect
          select distinct unnest(b.offer)
        ) s
      );

      reasons := '{}';
      if cardinality(overlap_offer_seek) > 0 then
        reasons := reasons || array[
          format('A offers what B seeks: %s', array_to_string(overlap_offer_seek, ', '))
        ];
      end if;
      if cardinality(overlap_seek_offer) > 0 then
        reasons := reasons || array[
          format('B offers what A seeks: %s', array_to_string(overlap_seek_offer, ', '))
        ];
      end if;

      if cardinality(reasons) = 0 then
        continue;
      end if;

      score := least(
        1::numeric,
        (cardinality(overlap_offer_seek) + cardinality(overlap_seek_offer))::numeric / 6.0
      );

      insert into public.matches (profile_a_id, profile_b_id, score, reasons, room_id, computed_at)
      values (a.profile_id, b.profile_id, score, reasons, p_room_id, now())
      on conflict (profile_a_id, profile_b_id, coalesce(room_id, '00000000-0000-0000-0000-000000000000'::uuid))
      do update set
        score = excluded.score,
        reasons = excluded.reasons,
        computed_at = excluded.computed_at
      returning * into inserted;

      return next inserted;
    end loop;
  end loop;
end;
$$;

revoke all on function public.compute_matches_for_room(uuid) from public;
grant execute on function public.compute_matches_for_room(uuid) to service_role;
