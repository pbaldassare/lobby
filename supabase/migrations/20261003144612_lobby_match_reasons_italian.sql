-- I motivi dell'affinità in italiano.
--
-- La funzione scriveva "A offers what B seeks: …": in inglese dentro un'app
-- italiana, e con "A" e "B" che a chi legge non dicono chi è chi — la stessa
-- riga la vedono entrambe le persone. La frase nuova non ha lati.
--
-- Solo le due stringhe cambiano: corpo, firma e permessi restano quelli di
-- 20260730172200 e 20260730173000 (`create or replace` conserva i grant).

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
          format('Uno offre ciò che l''altro cerca: %s', array_to_string(overlap_offer_seek, ', '))
        ];
      end if;
      if cardinality(overlap_seek_offer) > 0 then
        reasons := reasons || array[
          format('Uno offre ciò che l''altro cerca: %s', array_to_string(overlap_seek_offer, ', '))
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

-- Le righe già calcolate restano in inglese finché la stanza non viene
-- ricalcolata: si traducono qui, una volta.
update lobby.matches
set reasons = array(
  select regexp_replace(r, '^[AB] offers what [AB] seeks: ', 'Uno offre ciò che l''altro cerca: ')
  from unnest(reasons) as r
)
where exists (
  select 1 from unnest(reasons) as r where r ~ '^[AB] offers what [AB] seeks: '
);
