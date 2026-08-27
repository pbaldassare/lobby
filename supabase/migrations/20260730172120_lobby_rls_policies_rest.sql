-- Lobby RLS rest — intros, projects, chat, member_access + grant di schema.

create policy intros_select_involved
  on lobby.intros for select to authenticated
  using (
    introducer_id = auth.uid()
    or profile_a_id = auth.uid()
    or profile_b_id = auth.uid()
  );

create policy intros_insert_introducer_connected
  on lobby.intros for insert to authenticated
  with check (
    introducer_id = auth.uid()
    and lobby_private.are_connected(introducer_id, profile_a_id)
    and lobby_private.are_connected(introducer_id, profile_b_id)
    and not lobby_private.is_blocked(profile_a_id, profile_b_id)
  );

create policy intros_update_involved
  on lobby.intros for update to authenticated
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

create policy projects_select_own_discoverable_or_connected
  on lobby.projects for select to authenticated
  using (
    profile_id = auth.uid()
    or lobby_private.can_discover(auth.uid(), profile_id)
    or lobby_private.are_connected(auth.uid(), profile_id)
  );

create policy projects_insert_own
  on lobby.projects for insert to authenticated
  with check (profile_id = auth.uid());

create policy projects_update_own
  on lobby.projects for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy projects_delete_own
  on lobby.projects for delete to authenticated
  using (profile_id = auth.uid());

create policy chats_select_participant
  on lobby.chats for select to authenticated
  using (profile_a_id = auth.uid() or profile_b_id = auth.uid());

create policy messages_select_participant
  on lobby.messages for select to authenticated
  using (lobby_private.is_chat_participant(chat_id, auth.uid()));

create policy messages_insert_sender_participant
  on lobby.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and lobby_private.is_chat_participant(chat_id, auth.uid())
    and exists (
      select 1 from lobby.chats c
      where c.id = chat_id
        and lobby_private.are_connected(c.profile_a_id, c.profile_b_id)
    )
  );

create policy member_access_select_owner_or_staff
  on lobby.member_access for select to authenticated
  using (
    exists (
      select 1 from lobby.memberships m
      where m.id = member_access.membership_id
        and (
          m.profile_id = auth.uid()
          or lobby_private.is_venue_staff(m.venue_id, auth.uid())
        )
    )
  );

create policy member_access_write_venue_staff
  on lobby.member_access for insert to authenticated
  with check (
    exists (
      select 1 from lobby.memberships m
      where m.id = membership_id
        and lobby_private.is_venue_staff(m.venue_id, auth.uid())
        and m.verified_status = 'verified'
        and m.seal_issued_at is not null
    )
  );

create policy member_access_update_venue_staff
  on lobby.member_access for update to authenticated
  using (
    exists (
      select 1 from lobby.memberships m
      where m.id = member_access.membership_id
        and lobby_private.is_venue_staff(m.venue_id, auth.uid())
    )
  )
  with check (
    exists (
      select 1 from lobby.memberships m
      where m.id = membership_id
        and lobby_private.is_venue_staff(m.venue_id, auth.uid())
    )
  );

create policy member_access_delete_venue_staff
  on lobby.member_access for delete to authenticated
  using (
    exists (
      select 1 from lobby.memberships m
      where m.id = member_access.membership_id
        and lobby_private.is_venue_staff(m.venue_id, auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grant di schema
-- ---------------------------------------------------------------------------
grant usage on schema lobby to authenticated, anon;
grant select, insert, update, delete on all tables in schema lobby to authenticated;
grant usage, select on all sequences in schema lobby to authenticated;

-- anon non legge nulla di Lobby: serve una sessione autenticata.
revoke all on all tables in schema lobby from anon;

-- private_deck_url non è mai leggibile via Data API (nemmeno dal proprietario):
-- si passa da lobby.project_deck_url(id), che controlla proprietà o connessione.
-- Un REVOKE a livello di colonna non intacca un GRANT a livello di tabella:
-- va tolta la SELECT sulla tabella e riconcessa colonna per colonna.
revoke select on lobby.projects from authenticated;
grant select (
  id,
  profile_id,
  title,
  public_pitch,
  deck_requestable,
  created_at,
  updated_at
) on lobby.projects to authenticated;

-- Le policy RLS chiamano gli helper: il ruolo chiamante deve poterli eseguire.
-- `lobby_private` non è tra gli schemi esposti da PostgREST, quindi le funzioni
-- restano non invocabili via Data API.
grant usage on schema lobby_private to authenticated;
grant execute on all functions in schema lobby_private to authenticated;
