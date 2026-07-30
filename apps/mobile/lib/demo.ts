import type {
  Match,
  MemberAccess,
  Membership,
  Presence,
  Profile,
  Project,
  Room,
  RoomPerson,
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoRoom: Room = {
  id: DEMO_ROOM_ID,
  venue_id: DEMO_VENUE_ID,
  name: 'Members Lounge',
  created_at: new Date().toISOString(),
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
    deck_requestable: true,
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
