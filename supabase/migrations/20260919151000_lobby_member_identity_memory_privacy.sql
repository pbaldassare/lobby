-- Funzioni, trigger, RLS e storage per identità/memoria membro.

create or replace function lobby_private.open_room_visit(
  p_profile_id uuid,
  p_room_id uuid,
  p_entered_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  visit_id uuid;
begin
  select rv.id into visit_id
  from lobby.room_visits rv
  where rv.profile_id = p_profile_id
    and rv.left_at is null;

  if visit_id is not null then
    return visit_id;
  end if;

  insert into lobby.room_visits (
    profile_id, room_id, venue_id, room_name, venue_name, entered_at
  )
  select
    p_profile_id,
    r.id,
    r.venue_id,
    r.name,
    v.name,
    coalesce(p_entered_at, now())
  from lobby.rooms r
  join lobby.venues v on v.id = r.venue_id
  where r.id = p_room_id
  returning id into visit_id;

  return visit_id;
end;
$fn$;

create or replace function lobby_private.record_visible_encounters(
  p_visitor uuid,
  p_visit_id uuid,
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  self lobby.profiles;
begin
  if p_visitor is null or p_visit_id is null or p_room_id is null then
    return;
  end if;

  select * into self from lobby.profiles where id = p_visitor;

  insert into lobby.encounters (
    visitor_id,
    room_visit_id,
    seen_profile_id,
    snapshot_name,
    snapshot_headline,
    snapshot_company,
    snapshot_occupation,
    seen_at
  )
  select
    p_visitor,
    p_visit_id,
    pt.profile_id,
    pr.display_name,
    pr.headline,
    pr.company,
    pr.occupation,
    now()
  from lobby.presence pt
  join lobby.profiles pr on pr.id = pt.profile_id
  where pt.room_id = p_room_id
    and pt.profile_id <> p_visitor
    and pt.is_visible = true
    and lobby_private.presence_is_live(pt)
    and not lobby_private.is_blocked(p_visitor, pt.profile_id)
  on conflict (visitor_id, seen_profile_id, room_visit_id) do nothing;

  insert into lobby.encounters (
    visitor_id,
    room_visit_id,
    seen_profile_id,
    snapshot_name,
    snapshot_headline,
    snapshot_company,
    snapshot_occupation,
    seen_at
  )
  select
    pt.profile_id,
    ov.id,
    p_visitor,
    self.display_name,
    self.headline,
    self.company,
    self.occupation,
    now()
  from lobby.presence pt
  join lobby.room_visits ov
    on ov.profile_id = pt.profile_id
   and ov.left_at is null
  where pt.room_id = p_room_id
    and pt.profile_id <> p_visitor
    and pt.is_visible = true
    and lobby_private.presence_is_live(pt)
    and not lobby_private.is_blocked(p_visitor, pt.profile_id)
  on conflict (visitor_id, seen_profile_id, room_visit_id) do nothing;
end;
$fn$;

create or replace function lobby_private.close_room_visit_and_snapshot(
  p_profile_id uuid,
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  visit_id uuid;
  visit_room uuid;
begin
  update lobby.room_visits
  set left_at = now()
  where profile_id = p_profile_id
    and left_at is null
  returning id, room_id into visit_id, visit_room;

  if visit_id is null then
    return;
  end if;

  perform lobby_private.record_visible_encounters(
    p_profile_id,
    visit_id,
    coalesce(p_room_id, visit_room)
  );
end;
$fn$;

create or replace function lobby_private.sync_presence_memory()
returns trigger
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  visit_id uuid;
begin
  if tg_op = 'DELETE' then
    perform lobby_private.close_room_visit_and_snapshot(old.profile_id, old.room_id);
    return old;
  end if;

  if tg_op = 'INSERT' then
    visit_id := lobby_private.open_room_visit(new.profile_id, new.room_id, new.entered_at);
    if new.is_visible then
      perform lobby_private.record_visible_encounters(new.profile_id, visit_id, new.room_id);
    end if;
    return new;
  end if;

  if old.room_id is distinct from new.room_id then
    perform lobby_private.close_room_visit_and_snapshot(old.profile_id, old.room_id);
    visit_id := lobby_private.open_room_visit(new.profile_id, new.room_id, new.entered_at);
    if new.is_visible then
      perform lobby_private.record_visible_encounters(new.profile_id, visit_id, new.room_id);
    end if;
  elsif new.is_visible and not old.is_visible then
    visit_id := lobby_private.open_room_visit(new.profile_id, new.room_id, new.entered_at);
    perform lobby_private.record_visible_encounters(new.profile_id, visit_id, new.room_id);
  end if;

  return new;
end;
$fn$;

drop trigger if exists presence_sync_memory on lobby.presence;
create trigger presence_sync_memory
  after insert or update or delete on lobby.presence
  for each row execute function lobby_private.sync_presence_memory();

insert into lobby.room_visits (
  profile_id, room_id, venue_id, room_name, venue_name, entered_at
)
select
  pr.profile_id,
  r.id,
  r.venue_id,
  r.name,
  v.name,
  pr.entered_at
from lobby.presence pr
join lobby.rooms r on r.id = pr.room_id
join lobby.venues v on v.id = r.venue_id
where not exists (
  select 1
  from lobby.room_visits rv
  where rv.profile_id = pr.profile_id
    and rv.left_at is null
);

create or replace function lobby.import_linkedin_identity()
returns lobby.profiles
language plpgsql
security definer
set search_path = lobby, pg_temp
as $fn$
declare
  uid uuid := auth.uid();
  meta jsonb;
  ident jsonb;
  v_name text;
  v_picture text;
  v_headline text;
  v_subject text;
  row lobby.profiles;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select u.raw_user_meta_data into meta
  from auth.users u
  where u.id = uid;

  select i.identity_data into ident
  from auth.identities i
  where i.user_id = uid
    and i.provider in ('linkedin_oidc', 'linkedin')
  order by i.updated_at desc nulls last
  limit 1;

  if ident is null then
    raise exception 'linkedin identity not linked';
  end if;

  v_name := nullif(btrim(coalesce(
    ident ->> 'name',
    meta ->> 'name',
    meta ->> 'full_name',
    meta ->> 'given_name'
  )), '');
  v_picture := nullif(btrim(coalesce(
    ident ->> 'picture',
    meta ->> 'picture',
    meta ->> 'avatar_url'
  )), '');
  v_headline := nullif(btrim(coalesce(ident ->> 'headline', meta ->> 'headline')), '');
  v_subject := coalesce(ident ->> 'sub', ident ->> 'id', 'oidc');

  insert into lobby.linkedin_links (
    profile_id,
    subject,
    imported_at,
    imported_name,
    imported_headline,
    imported_picture_url,
    source
  )
  values (uid, v_subject, now(), v_name, v_headline, v_picture, 'oidc')
  on conflict (profile_id) do update set
    subject = excluded.subject,
    imported_at = now(),
    imported_name = excluded.imported_name,
    imported_headline = excluded.imported_headline,
    imported_picture_url = excluded.imported_picture_url,
    source = excluded.source;

  update lobby.profiles
  set
    display_name = case
      when display_name is null or btrim(display_name) = '' then v_name
      else display_name
    end,
    headline = case
      when headline is null or btrim(headline) = '' then v_headline
      else headline
    end,
    avatar_url = case
      when avatar_url is null or btrim(avatar_url) = '' then v_picture
      else avatar_url
    end
  where id = uid
  returning * into row;

  return row;
end;
$fn$;

revoke all on function lobby.import_linkedin_identity() from public;
grant execute on function lobby.import_linkedin_identity() to authenticated, service_role;

alter table lobby.linkedin_links enable row level security;
alter table lobby.linkedin_links force row level security;
alter table lobby.documents enable row level security;
alter table lobby.documents force row level security;
alter table lobby.room_visits enable row level security;
alter table lobby.room_visits force row level security;
alter table lobby.encounters enable row level security;
alter table lobby.encounters force row level security;

drop policy if exists linkedin_links_select_own on lobby.linkedin_links;
create policy linkedin_links_select_own
  on lobby.linkedin_links for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists documents_select_own_or_connected on lobby.documents;
create policy documents_select_own_or_connected
  on lobby.documents for select to authenticated
  using (
    profile_id = auth.uid()
    or lobby_private.are_connected(auth.uid(), profile_id)
  );

drop policy if exists documents_insert_own on lobby.documents;
create policy documents_insert_own
  on lobby.documents for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists documents_update_own on lobby.documents;
create policy documents_update_own
  on lobby.documents for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists documents_delete_own on lobby.documents;
create policy documents_delete_own
  on lobby.documents for delete to authenticated
  using (profile_id = auth.uid());

drop policy if exists room_visits_select_own on lobby.room_visits;
create policy room_visits_select_own
  on lobby.room_visits for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists encounters_select_own on lobby.encounters;
create policy encounters_select_own
  on lobby.encounters for select to authenticated
  using (visitor_id = auth.uid());

drop policy if exists projects_select_own_discoverable_or_connected on lobby.projects;
create policy projects_select_own_discoverable_or_connected
  on lobby.projects for select to authenticated
  using (
    profile_id = auth.uid()
    or (
      is_visible
      and (
        lobby_private.can_discover(auth.uid(), profile_id)
        or lobby_private.are_connected(auth.uid(), profile_id)
      )
    )
  );

grant select on lobby.linkedin_links to authenticated;
grant select, insert, update, delete on lobby.documents to authenticated;
grant select on lobby.room_visits to authenticated;
grant select on lobby.encounters to authenticated;

revoke select on lobby.projects from authenticated;
grant select (
  id,
  profile_id,
  title,
  public_pitch,
  deck_requestable,
  role_title,
  status,
  sort_order,
  is_visible,
  created_at,
  updated_at
) on lobby.projects to authenticated;

grant execute on function lobby_private.open_room_visit(uuid, uuid, timestamptz) to authenticated;
grant execute on function lobby_private.record_visible_encounters(uuid, uuid, uuid) to authenticated;
grant execute on function lobby_private.close_room_visit_and_snapshot(uuid, uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lobby-docs',
  'lobby-docs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists lobby_docs_select_own_or_connected on storage.objects;
create policy lobby_docs_select_own_or_connected
  on storage.objects for select to authenticated
  using (
    bucket_id = 'lobby-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        ((storage.foldername(name))[1]) ~* '^[0-9a-f-]{36}$'
        and lobby_private.are_connected(
          auth.uid(),
          ((storage.foldername(name))[1])::uuid
        )
      )
    )
  );

drop policy if exists lobby_docs_insert_own on storage.objects;
create policy lobby_docs_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lobby-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists lobby_docs_update_own on storage.objects;
create policy lobby_docs_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'lobby-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'lobby-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists lobby_docs_delete_own on storage.objects;
create policy lobby_docs_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lobby-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
