import type {
  Encounter,
  Intro,
  Match,
  MemberAccess,
  MemberDocument,
  Membership,
  Presence,
  Profile,
  Project,
  Room,
  RoomPerson,
  RoomVisit,
  Signal,
  Venue,
} from '@lobby/shared/types';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_ROOM_ID = '00000000-0000-4000-8000-000000000010';
export const DEMO_VENUE_ID = '00000000-0000-4000-8000-000000000020';

export const demoVenue: Venue = {
  id: DEMO_VENUE_ID,
  name: 'Soho House',
  city: 'Milan',
  city_place_id: null,
  city_lat: null,
  city_lng: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoRoom: Room = {
  id: DEMO_ROOM_ID,
  venue_id: DEMO_VENUE_ID,
  name: 'Members Lounge',
  created_at: new Date().toISOString(),
  opens_at: null,
  /** Una serata che finisce fra tre ore: serve a vedere il conto alla
   *  rovescia della stanza senza un database dietro. */
  closes_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
};

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  role: 'member',
  display_name: 'Alex Rivera',
  headline: 'Product · climate tech',
  spotlight: 'Building a marketplace for industrial waste heat.',
  offer: ['intros to operators', 'product advisory'],
  seek: ['energy partners', 'series A intros'],
  company: 'Hearth',
  occupation: 'Product lead',
  hobbies: ['alpinismo', 'vinile'],
  linkedin_url: 'https://www.linkedin.com/in/alex-rivera',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoMembership: Membership & { venue: Venue } = {
  id: '00000000-0000-4000-8000-000000000030',
  profile_id: DEMO_USER_ID,
  venue_id: DEMO_VENUE_ID,
  since: '2024-03-01',
  verified_status: 'verified',
  seal_issued_at: '2024-03-12T10:00:00.000Z',
  seal_issued_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  venue: demoVenue,
};

export function createDemoPresence(isVisible: boolean): Presence {
  return {
    id: '00000000-0000-4000-8000-000000000040',
    profile_id: DEMO_USER_ID,
    room_id: DEMO_ROOM_ID,
    is_visible: isVisible,
    visible_until: isVisible
      ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      : null,
    last_heartbeat: new Date().toISOString(),
    entered_at: new Date().toISOString(),
  };
}

const other: Profile = {
  id: '00000000-0000-4000-8000-000000000002',
  role: 'member',
  display_name: 'Mia Chen',
  headline: 'GP · climate fund',
  spotlight: 'Deploying growth capital into hard-tech.',
  offer: ['capital', 'board seats'],
  seek: ['industrial decarbonization'],
  company: 'Northline',
  occupation: 'General partner',
  hobbies: ['nuoto', 'ceramica'],
  linkedin_url: null,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/** Una terza persona: senza, non c'è nessuno da presentare a nessuno. */
const third: Profile = {
  id: '00000000-0000-4000-8000-000000000003',
  role: 'member',
  display_name: 'Tomás Ruiz',
  headline: 'Founder · grid software',
  spotlight: 'Software di bilanciamento per reti industriali.',
  offer: ['integrazioni', 'dati di consumo'],
  seek: ['pilota industriale', 'partner energetici'],
  company: 'Gridwise',
  occupation: 'Founder',
  hobbies: ['ciclismo'],
  linkedin_url: null,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoRoomPeople: RoomPerson[] = [
  {
    profile: other,
    presence: {
      id: '00000000-0000-4000-8000-000000000041',
      profile_id: other.id,
      room_id: DEMO_ROOM_ID,
      is_visible: true,
      visible_until: null,
      last_heartbeat: new Date().toISOString(),
      entered_at: new Date().toISOString(),
    },
    match: {
      id: '00000000-0000-4000-8000-000000000050',
      score: 0.87,
      reasons: ['You seek energy partners · Mia invests in industrial climate'],
    },
    membership: {
      ...demoMembership,
      id: '00000000-0000-4000-8000-000000000031',
      profile_id: other.id,
    },
  },
];

export const demoMatches: Array<Match & { other: Profile }> = [
  {
    id: '00000000-0000-4000-8000-000000000050',
    profile_a_id: DEMO_USER_ID,
    profile_b_id: other.id,
    score: 0.87,
    reasons: [
      'Offer/seek overlap on industrial climate',
      'Both building in Milan this quarter',
    ],
    room_id: DEMO_ROOM_ID,
    computed_at: new Date().toISOString(),
    other,
  },
];

export const demoProjects: Project[] = [
  {
    id: '00000000-0000-4000-8000-000000000060',
    profile_id: DEMO_USER_ID,
    title: 'Hearth Exchange',
    public_pitch: 'Marketplace matching factories with district heating buyers.',
    private_deck_url: null,
    private_deck_file_name: null,
    deck_requestable: true,
    role_title: 'Founder',
    status: 'active',
    sort_order: 0,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const demoSignals: Signal[] = [];

export const demoAccess: MemberAccess[] = [
  {
    id: '00000000-0000-4000-8000-000000000070',
    membership_id: demoMembership.id,
    access_key: 'rooftop',
    label: 'Rooftop terrace — members',
    granted_at: new Date().toISOString(),
    expires_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-4000-8000-000000000071',
    membership_id: demoMembership.id,
    access_key: 'guest-pass',
    label: '2 guest passes / month',
    granted_at: new Date().toISOString(),
    expires_at: null,
    created_at: new Date().toISOString(),
  },
];

/** Presentazioni dimostrative: una fatta da te, una ricevuta. */
export const demoIntros: Array<
  Intro & { a: Profile; b: Profile; introducer: Profile; direction: 'made' | 'received' }
> = [
  {
    id: '00000000-0000-4000-8000-000000000060',
    introducer_id: DEMO_USER_ID,
    profile_a_id: other.id,
    profile_b_id: third.id,
    message: 'Mia investe in clima industriale, Tomás costruisce il software. Parlatevi.',
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    responded_at: null,
    a: other,
    b: third,
    introducer: demoProfile,
    direction: 'made' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000061',
    introducer_id: third.id,
    profile_a_id: DEMO_USER_ID,
    profile_b_id: other.id,
    message: 'Vi ho messi in contatto: state guardando lo stesso problema da due lati.',
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    responded_at: null,
    a: demoProfile,
    b: other,
    introducer: third,
    direction: 'received' as const,
  },
];

export const demoCv: MemberDocument = {
  id: '00000000-0000-4000-8000-000000000080',
  profile_id: DEMO_USER_ID,
  kind: 'cv',
  file_path: `${DEMO_USER_ID}/cv/alex-rivera.pdf`,
  file_name: 'alex-rivera.pdf',
  mime_type: 'application/pdf',
  byte_size: 128_000,
  created_at: new Date().toISOString(),
};

const demoVisit: RoomVisit = {
  id: '00000000-0000-4000-8000-000000000090',
  profile_id: DEMO_USER_ID,
  room_id: DEMO_ROOM_ID,
  venue_id: DEMO_VENUE_ID,
  room_name: demoRoom.name,
  venue_name: demoVenue.name,
  entered_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  left_at: null,
};

export const demoRoomVisits: RoomVisit[] = [demoVisit];

export const demoEncounters: Encounter[] = [
  {
    id: '00000000-0000-4000-8000-000000000091',
    visitor_id: DEMO_USER_ID,
    room_visit_id: demoVisit.id,
    seen_profile_id: other.id,
    snapshot_name: other.display_name,
    snapshot_headline: other.headline,
    snapshot_company: other.company,
    snapshot_occupation: other.occupation,
    seen_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
];
