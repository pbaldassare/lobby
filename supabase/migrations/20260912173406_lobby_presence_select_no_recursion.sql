-- The SELECT policy on lobby.presence re-queried lobby.presence in USING.
-- Postgres re-enters the same policy: infinite recursion on own-row reads
-- (login) and on INSERT/UPDATE ... RETURNING (enter room).
-- share_visible_room is SECURITY DEFINER and bypasses RLS.

drop policy if exists presence_select_own_discoverable_or_staff on lobby.presence;

create policy presence_select_own_discoverable_or_staff
  on lobby.presence for select to authenticated
  using (
    profile_id = auth.uid()
    or (
      lobby_private.share_visible_room(auth.uid(), profile_id)
      and not lobby_private.is_blocked(auth.uid(), profile_id)
    )
    or exists (
      select 1
      from lobby.rooms r
      where r.id = presence.room_id
        and lobby_private.is_venue_staff(r.venue_id, auth.uid())
    )
  );
