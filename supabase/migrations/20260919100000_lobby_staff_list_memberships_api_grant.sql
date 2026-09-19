-- PostgREST costruisce la schema cache sul ruolo anon:
-- senza EXECUTE ad anon la RPC non compare e il client dice
-- «Could not find the function lobby.staff_list_memberships».
-- Il corpo resta gated da auth.uid() + is_venue_staff.

grant execute on function lobby.staff_list_memberships(uuid)
  to anon, authenticated, service_role;
grant execute on function lobby.staff_list_presence(uuid)
  to anon, authenticated, service_role;
grant execute on function lobby.staff_list_connections(uuid)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
