-- auth.users.email è varchar: senza cast RETURN QUERY non coincide
-- con RETURNS TABLE(... email text ...).

create or replace function lobby.staff_list_memberships(p_venue_id uuid)
returns table (
  membership_id uuid,
  profile_id uuid,
  email text,
  display_name text,
  headline text,
  company text,
  verified_status lobby.verification_status,
  since date,
  seal_issued_at timestamptz
)
language plpgsql
stable
security definer
set search_path = lobby, auth, pg_temp
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Devi fare l''accesso.';
  end if;
  if not lobby_private.is_venue_staff(p_venue_id, auth.uid()) then
    raise exception 'Non sei autorizzato per questo venue.';
  end if;

  return query
  select
    m.id,
    m.profile_id,
    u.email::text,
    p.display_name,
    p.headline,
    p.company,
    m.verified_status,
    m.since,
    m.seal_issued_at
  from lobby.memberships m
  join lobby.profiles p on p.id = m.profile_id
  join auth.users u on u.id = m.profile_id
  where m.venue_id = p_venue_id
  order by
    case m.verified_status
      when 'pending' then 0
      when 'verified' then 1
      else 2
    end,
    p.display_name;
end;
$fn$;

revoke all on function lobby.staff_list_memberships(uuid) from public;
grant execute on function lobby.staff_list_memberships(uuid)
  to authenticated, service_role;
