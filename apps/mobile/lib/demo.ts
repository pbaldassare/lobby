import type {
  Intro,
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
  city: 'Milano',
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
  headline: 'Prodotto · climate tech',
  spotlight: 'Sto costruendo un mercato per il calore di scarto industriale.',
  offer: ['presentazioni a operatori', 'consulenza di prodotto'],
  seek: ['partner energetici', 'contatti per il round A'],
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

/**
 * Stato della dimostrazione che deve sopravvivere a un rimontaggio dell'app.
 *
 * Sul web expo-router può rimontare l'intero albero quando la cronologia del
 * browser e quella di navigazione divergono (indietro, cambio scheda, apri,
 * indietro). I provider perdono lo stato: con Supabase la sessione si
 * rilegge dallo storage, in dimostrazione viveva solo in `useState` e ci si
 * ritrovava alla porta. Qui resta finché la pagina non viene ricaricata.
 */
export const demoMemory: {
  signedIn: boolean;
  profile: Profile | null;
  /** Null finché la presenza non è mai stata toccata in questa sessione. */
  presence: { room: Room | null; presence: Presence | null } | null;
} = { signedIn: false, profile: null, presence: null };

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
  headline: 'GP · fondo per il clima',
  spotlight: 'Investo capitale di crescita in tecnologie industriali.',
  offer: ['capitale', 'posti in consiglio'],
  seek: ['decarbonizzazione industriale'],
  company: 'Northline',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/** Una terza persona: senza, non c'è nessuno da presentare a nessuno. */
const third: Profile = {
  id: '00000000-0000-4000-8000-000000000003',
  role: 'member',
  display_name: 'Tomás Ruiz',
  headline: 'Fondatore · software per le reti',
  spotlight: 'Software di bilanciamento per reti industriali.',
  offer: ['integrazioni', 'dati di consumo'],
  seek: ['pilota industriale', 'partner energetici'],
  company: 'Gridwise',
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
      reasons: ['Cerchi partner energetici · Mia investe in clima industriale'],
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
      'Quello che offri e quello che cerca si incontrano sul clima industriale',
      'Entrambi al lavoro a Milano in questo trimestre',
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
    public_pitch: 'Un mercato che mette in contatto le fabbriche con chi compra calore per il teleriscaldamento.',
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
    label: 'Terrazza sul tetto — soci',
    granted_at: new Date().toISOString(),
    expires_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-4000-8000-000000000071',
    membership_id: demoMembership.id,
    access_key: 'guest-pass',
    label: '2 inviti per ospiti al mese',
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
