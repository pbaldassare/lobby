-- Fixture temporanee: 4 locali/stanze con QR + canali di ingresso,
-- e membri @lobby.demo. Si cancellano con lobby_private.wipe_demo_fixtures().

create or replace function lobby_private.wipe_demo_fixtures()
returns void
language plpgsql
security definer
set search_path = lobby, auth, pg_temp
as $fn$
declare
  v_venues uuid[] := array[
    'c0ffeeee-0001-4000-8000-000000000001'::uuid,
    'c0ffeeee-0001-4000-8000-000000000002'::uuid,
    'c0ffeeee-0001-4000-8000-000000000003'::uuid,
    'c0ffeeee-0001-4000-8000-000000000004'::uuid
  ];
  v_rooms uuid[] := array[
    'c0ffeeee-1001-4000-8000-000000000001'::uuid,
    'c0ffeeee-1001-4000-8000-000000000002'::uuid,
    'c0ffeeee-1001-4000-8000-000000000003'::uuid,
    'c0ffeeee-1001-4000-8000-000000000004'::uuid
  ];
begin
  delete from lobby.presence where room_id = any (v_rooms)
    or profile_id in (select id from auth.users where email like '%@lobby.demo');
  delete from lobby.passes where room_id = any (v_rooms)
    or profile_id in (select id from auth.users where email like '%@lobby.demo');
  delete from lobby.memberships where venue_id = any (v_venues)
    or profile_id in (select id from auth.users where email like '%@lobby.demo');
  delete from lobby.venue_staff where venue_id = any (v_venues);
  delete from lobby.room_access where room_id = any (v_rooms);
  delete from lobby.rooms where id = any (v_rooms);
  delete from lobby.venues where id = any (v_venues);
  delete from auth.users where email like '%@lobby.demo';
end;
$fn$;

revoke all on function lobby_private.wipe_demo_fixtures() from public, anon, authenticated;
grant execute on function lobby_private.wipe_demo_fixtures() to service_role;

-- ---------------------------------------------------------------------------
-- Locali e stanze
-- ---------------------------------------------------------------------------
insert into lobby.venues (id, name, city)
values
  ('c0ffeeee-0001-4000-8000-000000000001', 'Demo · Caffè Magenta', 'Milano'),
  ('c0ffeeee-0001-4000-8000-000000000002', 'Demo · Club Navigli', 'Milano'),
  ('c0ffeeee-0001-4000-8000-000000000003', 'Demo · Hotel Scala', 'Milano'),
  ('c0ffeeee-0001-4000-8000-000000000004', 'Demo · Cowork Porta', 'Milano')
on conflict (id) do update
  set name = excluded.name, city = excluded.city, updated_at = now();

insert into lobby.rooms (id, venue_id, name)
values
  ('c0ffeeee-1001-4000-8000-000000000001', 'c0ffeeee-0001-4000-8000-000000000001', 'Sala lettura'),
  ('c0ffeeee-1001-4000-8000-000000000002', 'c0ffeeee-0001-4000-8000-000000000002', 'Terrazza'),
  ('c0ffeeee-1001-4000-8000-000000000003', 'c0ffeeee-0001-4000-8000-000000000003', 'Lobby bar'),
  ('c0ffeeee-1001-4000-8000-000000000004', 'c0ffeeee-0001-4000-8000-000000000004', 'Sala riunioni')
on conflict (id) do update
  set name = excluded.name, venue_id = excluded.venue_id;

insert into lobby.room_access (room_id, method, param, grants_for)
select v.room_id, v.method, v.param, v.grants_for
from (
  values
    ('c0ffeeee-1001-4000-8000-000000000001'::uuid, 'qr'::lobby.access_method, null::text, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000001', 'membership', null, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000001', 'email_domain', 'lobby.demo', interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000001', 'wifi_portal', 'demo-magenta', interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000002', 'qr', null, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000002', 'membership', null, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000002', 'email_domain', 'lobby.demo', interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000002', 'wifi_portal', 'demo-navigli', interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000003', 'qr', null, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000003', 'membership', null, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000003', 'email_domain', 'lobby.demo', interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000003', 'wifi_portal', 'demo-scala', interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000004', 'qr', null, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000004', 'membership', null, interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000004', 'email_domain', 'lobby.demo', interval '12 hours'),
    ('c0ffeeee-1001-4000-8000-000000000004', 'wifi_portal', 'demo-porta', interval '12 hours')
) as v(room_id, method, param, grants_for)
where not exists (
  select 1 from lobby.room_access a
  where a.room_id = v.room_id
    and a.method = v.method
    and coalesce(lower(a.param), '') = coalesce(lower(v.param), '')
);

-- Kato vede le istanze demo in back-office
insert into lobby.venue_staff (venue_id, profile_id, staff_role)
select v.id, '31181038-d395-469e-b793-657879846df2'::uuid, 'staff'
from lobby.venues v
where v.id in (
  'c0ffeeee-0001-4000-8000-000000000001',
  'c0ffeeee-0001-4000-8000-000000000002',
  'c0ffeeee-0001-4000-8000-000000000003',
  'c0ffeeee-0001-4000-8000-000000000004'
)
on conflict (venue_id, profile_id) do nothing;

-- ---------------------------------------------------------------------------
-- Utenti membro (password usa crypt; account usa e getta)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, reauthentication_token,
  phone_change, phone_change_token, is_sso_user, is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt('LobbyDemo1!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name),
  now(),
  now(),
  '', '', '', '', '', '', '', '',
  false,
  false
from (
  values
    ('c0ffeeee-2001-4000-8000-000000000001'::uuid, 'giulia.neri@lobby.demo', 'Giulia Neri'),
    ('c0ffeeee-2001-4000-8000-000000000002', 'luca.ferraro@lobby.demo', 'Luca Ferraro'),
    ('c0ffeeee-2001-4000-8000-000000000003', 'sara.bianchi@lobby.demo', 'Sara Bianchi'),
    ('c0ffeeee-2001-4000-8000-000000000004', 'matteo.conti@lobby.demo', 'Matteo Conti'),
    ('c0ffeeee-2001-4000-8000-000000000005', 'elena.rossi@lobby.demo', 'Elena Rossi'),
    ('c0ffeeee-2001-4000-8000-000000000006', 'anna.verde@lobby.demo', 'Anna Verde')
) as u(id, email, full_name)
where not exists (select 1 from auth.users x where x.id = u.id or x.email = u.email);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id,
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from (
  values
    ('c0ffeeee-2001-4000-8000-000000000001'::uuid, 'giulia.neri@lobby.demo'),
    ('c0ffeeee-2001-4000-8000-000000000002', 'luca.ferraro@lobby.demo'),
    ('c0ffeeee-2001-4000-8000-000000000003', 'sara.bianchi@lobby.demo'),
    ('c0ffeeee-2001-4000-8000-000000000004', 'matteo.conti@lobby.demo'),
    ('c0ffeeee-2001-4000-8000-000000000005', 'elena.rossi@lobby.demo'),
    ('c0ffeeee-2001-4000-8000-000000000006', 'anna.verde@lobby.demo')
) as u(id, email)
where not exists (
  select 1 from auth.identities i
  where i.provider = 'email' and i.provider_id = u.id::text
);

update lobby.profiles p
set
  role = 'member',
  display_name = u.display_name,
  headline = u.headline,
  spotlight = u.spotlight,
  offer = u.offer,
  seek = u.seek,
  company = u.company,
  updated_at = now()
from (
  values
    (
      'c0ffeeee-2001-4000-8000-000000000001'::uuid,
      'Giulia Neri',
      'Product · climate tech',
      'Marketplace per il calore di scarto industriale.',
      array['intro operator', 'advisory prodotto'],
      array['partner energetici', 'intro series A'],
      'Hearth'
    ),
    (
      'c0ffeeee-2001-4000-8000-000000000002',
      'Luca Ferraro',
      'GP · climate fund',
      'Capitale di crescita su hard-tech.',
      array['capitale', 'board'],
      array['decarbonizzazione industriale'],
      'Northline'
    ),
    (
      'c0ffeeee-2001-4000-8000-000000000003',
      'Sara Bianchi',
      'Founder · grid software',
      'Bilanciamento reti industriali.',
      array['integrazioni', 'dati di consumo'],
      array['pilota industriale'],
      'Gridwise'
    ),
    (
      'c0ffeeee-2001-4000-8000-000000000004',
      'Matteo Conti',
      'Design · hospitality',
      'Spazi e rituali per club e hotel.',
      array['direction creativa'],
      array['operatori venue'],
      'Atelier Conti'
    ),
    (
      'c0ffeeee-2001-4000-8000-000000000005',
      'Elena Rossi',
      'Ops · coworking',
      'Community e membership B2B.',
      array['community'],
      array['partnership corporate'],
      'Porta Hub'
    ),
    (
      'c0ffeeee-2001-4000-8000-000000000006',
      'Anna Verde',
      'Strategy · food & beverage',
      'Format per lounge e caffè urbani.',
      array['concept F&B'],
      array['location Milano'],
      'Verde Studio'
    )
) as u(id, display_name, headline, spotlight, offer, seek, company)
where p.id = u.id;

-- Registrati: sigillo su tutti i venue demo (Elena resta in attesa su Magenta)
insert into lobby.memberships (
  profile_id, venue_id, verified_status, seal_issued_at, seal_issued_by
)
select m.profile_id, m.venue_id, m.status, m.seal_at, m.issuer
from (
  values
    -- Giulia, Luca, Sara, Matteo, Anna: verificati su tutti e 4
    ('c0ffeeee-2001-4000-8000-000000000001'::uuid, 'c0ffeeee-0001-4000-8000-000000000001'::uuid, 'verified'::lobby.verification_status, now(), '31181038-d395-469e-b793-657879846df2'::uuid),
    ('c0ffeeee-2001-4000-8000-000000000001', 'c0ffeeee-0001-4000-8000-000000000002', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000001', 'c0ffeeee-0001-4000-8000-000000000003', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000001', 'c0ffeeee-0001-4000-8000-000000000004', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000002', 'c0ffeeee-0001-4000-8000-000000000001', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000002', 'c0ffeeee-0001-4000-8000-000000000002', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000002', 'c0ffeeee-0001-4000-8000-000000000003', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000002', 'c0ffeeee-0001-4000-8000-000000000004', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000003', 'c0ffeeee-0001-4000-8000-000000000001', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000003', 'c0ffeeee-0001-4000-8000-000000000002', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000003', 'c0ffeeee-0001-4000-8000-000000000003', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000003', 'c0ffeeee-0001-4000-8000-000000000004', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000004', 'c0ffeeee-0001-4000-8000-000000000001', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000004', 'c0ffeeee-0001-4000-8000-000000000002', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000004', 'c0ffeeee-0001-4000-8000-000000000003', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000004', 'c0ffeeee-0001-4000-8000-000000000004', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000006', 'c0ffeeee-0001-4000-8000-000000000001', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000006', 'c0ffeeee-0001-4000-8000-000000000002', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000006', 'c0ffeeee-0001-4000-8000-000000000003', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('c0ffeeee-2001-4000-8000-000000000006', 'c0ffeeee-0001-4000-8000-000000000004', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    -- Elena: in attesa solo su Magenta (lista Registrati)
    ('c0ffeeee-2001-4000-8000-000000000005', 'c0ffeeee-0001-4000-8000-000000000001', 'pending', null, null),
    -- Kato: socio col sigillo così dall'app entra toccando l'etichetta
    ('31181038-d395-469e-b793-657879846df2', 'c0ffeeee-0001-4000-8000-000000000001', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('31181038-d395-469e-b793-657879846df2', 'c0ffeeee-0001-4000-8000-000000000002', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('31181038-d395-469e-b793-657879846df2', 'c0ffeeee-0001-4000-8000-000000000003', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('31181038-d395-469e-b793-657879846df2', 'c0ffeeee-0001-4000-8000-000000000004', 'verified', now(), '31181038-d395-469e-b793-657879846df2'),
    ('31181038-d395-469e-b793-657879846df2', 'a1111111-1111-4111-8111-111111111111', 'verified', now(), '31181038-d395-469e-b793-657879846df2')
) as m(profile_id, venue_id, status, seal_at, issuer)
on conflict (profile_id, venue_id) do update
  set
    verified_status = excluded.verified_status,
    seal_issued_at = excluded.seal_issued_at,
    seal_issued_by = excluded.seal_issued_by,
    updated_at = now();

-- Permesso + presenza: qualcuno è già in stanza (visibile)
insert into lobby.passes (profile_id, room_id, method, expires_at)
select p.profile_id, p.room_id, 'membership'::lobby.access_method, now() + interval '12 hours'
from (
  values
    ('c0ffeeee-2001-4000-8000-000000000001'::uuid, 'c0ffeeee-1001-4000-8000-000000000001'::uuid),
    ('c0ffeeee-2001-4000-8000-000000000002', 'c0ffeeee-1001-4000-8000-000000000001'),
    ('c0ffeeee-2001-4000-8000-000000000003', 'c0ffeeee-1001-4000-8000-000000000002'),
    ('c0ffeeee-2001-4000-8000-000000000004', 'c0ffeeee-1001-4000-8000-000000000003')
) as p(profile_id, room_id)
where not exists (
  select 1 from lobby.passes x
  where x.profile_id = p.profile_id
    and x.room_id = p.room_id
    and x.revoked_at is null
    and x.expires_at > now()
);

insert into lobby.presence (
  profile_id, room_id, is_visible, visible_until, last_heartbeat, entered_at
)
values
  (
    'c0ffeeee-2001-4000-8000-000000000001',
    'c0ffeeee-1001-4000-8000-000000000001',
    true,
    now() + interval '4 hours',
    now(),
    now()
  ),
  (
    'c0ffeeee-2001-4000-8000-000000000002',
    'c0ffeeee-1001-4000-8000-000000000001',
    true,
    now() + interval '4 hours',
    now(),
    now()
  ),
  (
    'c0ffeeee-2001-4000-8000-000000000003',
    'c0ffeeee-1001-4000-8000-000000000002',
    true,
    now() + interval '4 hours',
    now(),
    now()
  ),
  (
    'c0ffeeee-2001-4000-8000-000000000004',
    'c0ffeeee-1001-4000-8000-000000000003',
    false,
    null,
    now(),
    now()
  )
on conflict (profile_id) do update
  set
    room_id = excluded.room_id,
    is_visible = excluded.is_visible,
    visible_until = excluded.visible_until,
    last_heartbeat = excluded.last_heartbeat,
    entered_at = excluded.entered_at;
