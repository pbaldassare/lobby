-- Lobby: Realtime per la presence in room + RPC privilegiate usate dalle Edge Function

-- ---------------------------------------------------------------------------
-- Realtime: chi è visibile nella room adesso
-- ---------------------------------------------------------------------------
alter table lobby.presence replica identity full;

do $do$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'lobby'
      and tablename = 'presence'
  ) then
    alter publication supabase_realtime add table lobby.presence;
  end if;
end;
$do$;

-- Chat realtime (solo peer connessi, filtrati da RLS)
alter table lobby.messages replica identity full;

do $do$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'lobby'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table lobby.messages;
  end if;
end;
$do$;

-- ---------------------------------------------------------------------------
-- RPC privilegiate (service_role / Edge Function)
-- ---------------------------------------------------------------------------

-- issue_seal: lo staff del venue emette il sigillo (mai auto-emesso dal membro)
create or replace function lobby.issue_seal(p_membership_id uuid, p_issuer_id uuid)
returns lobby.memberships
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  m lobby.memberships;
begin
  select * into m from lobby.memberships where id = p_membership_id for update;
  if m.id is null then
    raise exception 'membership not found';
  end if;

  if not lobby_private.is_venue_staff(m.venue_id, p_issuer_id) then
    raise exception 'not venue staff for this venue';
  end if;

  update lobby.memberships
  set
    verified_status = 'verified',
    seal_issued_at = now(),
    seal_issued_by = p_issuer_id
  where id = p_membership_id
  returning * into m;

  return m;
end;
$fn$;

revoke all on function lobby.issue_seal(uuid, uuid) from public;
grant execute on function lobby.issue_seal(uuid, uuid) to service_role;

-- send_signal: richiesta di contatto con rate limit
create or replace function lobby.send_signal(
  p_from uuid,
  p_to uuid,
  p_message text default null
)
returns lobby.signals
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  sent_today int;
  row lobby.signals;
begin
  if p_from is null or p_to is null or p_from = p_to then
    raise exception 'invalid signal participants';
  end if;

  if lobby_private.is_blocked(p_from, p_to) then
    raise exception 'blocked';
  end if;

  if not lobby_private.can_discover(p_from, p_to) then
    raise exception 'not discoverable in shared visible room';
  end if;

  select count(*)::int into sent_today
  from lobby.signals s
  where s.from_profile_id = p_from
    and s.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  if sent_today >= lobby_private.signal_daily_limit() then
    raise exception 'daily signal limit reached (%)', lobby_private.signal_daily_limit();
  end if;

  if exists (
    select 1 from lobby.signals s
    where s.status = 'connected'
      and (
        (s.from_profile_id = p_from and s.to_profile_id = p_to)
        or (s.from_profile_id = p_to and s.to_profile_id = p_from)
      )
  ) then
    raise exception 'already connected';
  end if;

  if exists (
    select 1 from lobby.signals s
    where s.from_profile_id = p_from
      and s.to_profile_id = p_to
      and s.status = 'pending'
  ) then
    raise exception 'signal already pending';
  end if;

  insert into lobby.signals (from_profile_id, to_profile_id, status, message)
  values (p_from, p_to, 'pending', p_message)
  returning * into row;

  return row;
end;
$fn$;

revoke all on function lobby.send_signal(uuid, uuid, text) from public;
grant execute on function lobby.send_signal(uuid, uuid, text) to service_role;

-- compute_matches: sovrapposizione offer/seek fra i visibili in una room
create or replace function lobby.compute_matches_for_room(p_room_id uuid)
returns setof lobby.matches
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  a record;
  b record;
  overlap_offer_seek text[];
  overlap_seek_offer text[];
  reasons text[];
  score numeric(5, 4);
  inserted lobby.matches;
begin
  for a in
    select pr.profile_id, p.offer, p.seek
    from lobby.presence pr
    join lobby.profiles p on p.id = pr.profile_id
    where pr.room_id = p_room_id
      and pr.is_visible = true
      and lobby_private.presence_is_live(pr)
      and (pr.visible_until is null or pr.visible_until > now())
  loop
    for b in
      select pr.profile_id, p.offer, p.seek
      from lobby.presence pr
      join lobby.profiles p on p.id = pr.profile_id
      where pr.room_id = p_room_id
        and pr.profile_id > a.profile_id
        and pr.is_visible = true
        and lobby_private.presence_is_live(pr)
        and (pr.visible_until is null or pr.visible_until > now())
    loop
      if lobby_private.is_blocked(a.profile_id, b.profile_id) then
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

      insert into lobby.matches (profile_a_id, profile_b_id, score, reasons, room_id, computed_at)
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
$fn$;

revoke all on function lobby.compute_matches_for_room(uuid) from public;
grant execute on function lobby.compute_matches_for_room(uuid) to service_role;
