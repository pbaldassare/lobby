-- Lobby RLS rest (applied remotely as lobby_rls_policies_rest)

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

create policy projects_select_own_discoverable_or_connected
  on public.projects for select to authenticated
  using (
    profile_id = auth.uid()
    or private.can_discover(auth.uid(), profile_id)
    or private.are_connected(auth.uid(), profile_id)
  );

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

create policy project_private_decks_select_owner_or_connected
  on public.project_private_decks for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_private_decks.project_id
        and (
          p.profile_id = auth.uid()
          or private.are_connected(auth.uid(), p.profile_id)
        )
    )
  );

create policy project_private_decks_write_owner
  on public.project_private_decks for insert to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.profile_id = auth.uid()
    )
  );

create policy project_private_decks_update_owner
  on public.project_private_decks for update to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_private_decks.project_id and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.profile_id = auth.uid()
    )
  );

create policy project_private_decks_delete_owner
  on public.project_private_decks for delete to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_private_decks.project_id and p.profile_id = auth.uid()
    )
  );

create policy chats_select_participant
  on public.chats for select to authenticated
  using (profile_a_id = auth.uid() or profile_b_id = auth.uid());

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

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;
