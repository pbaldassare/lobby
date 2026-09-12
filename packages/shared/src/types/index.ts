/**
 * Domain types aligned with supabase/migrations lobby schema.
 * Keep in sync when the backend agent evolves migrations.
 */

export type UserRole = 'member' | 'staff' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'revoked';
export type SignalStatus = 'pending' | 'connected' | 'declined';
export type IntroStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

/** Staff-facing report status (table may land in a follow-up migration). */
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string | null;
  headline: string | null;
  spotlight: string | null;
  offer: string[];
  seek: string[];
  company: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Venue = {
  id: string;
  name: string;
  city: string;
  created_at: string;
  updated_at: string;
};

export type VenueStaff = {
  id: string;
  venue_id: string;
  profile_id: string;
  staff_role: Extract<UserRole, 'staff' | 'admin'>;
  created_at: string;
};

export type Membership = {
  id: string;
  profile_id: string;
  venue_id: string;
  since: string;
  verified_status: VerificationStatus;
  seal_issued_at: string | null;
  seal_issued_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  venue_id: string;
  name: string;
  created_at: string;
  /** Una serata è una stanza che finisce. Null = stanza permanente. */
  opens_at: string | null;
  closes_at: string | null;
};

/** I canali che aprono una stanza. Dimostrano tutti la stessa cosa. */
export type AccessMethod = 'qr' | 'wifi_portal' | 'email_domain' | 'invite' | 'membership';

export type RoomAccess = {
  id: string;
  room_id: string;
  method: AccessMethod;
  /** Il dominio per `email_domain`, la rete per `wifi_portal`. Null per `qr`. */
  param: string | null;
  /** Durata del permesso concesso da questo canale. */
  grants_for?: string | null;
  created_at: string;
};

/** Prova che una persona può stare in una stanza fino a un momento preciso.
 *  Lo rilascia sempre il server: non esiste una policy che permetta a un
 *  client di scriverne uno. */
export type Pass = {
  id: string;
  profile_id: string;
  room_id: string;
  method: AccessMethod;
  granted_at: string;
  expires_at: string;
  revoked_at: string | null;
  granted_by: string | null;
};

export type Presence = {
  id: string;
  profile_id: string;
  room_id: string;
  is_visible: boolean;
  visible_until: string | null;
  last_heartbeat: string;
  entered_at: string;
};

export type Block = {
  id: string;
  blocker_id: string;
  blocked_profile_id: string | null;
  blocked_company: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  score: number;
  reasons: string[];
  room_id: string | null;
  computed_at: string;
};

export type Signal = {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  status: SignalStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
};

export type Intro = {
  id: string;
  introducer_id: string;
  profile_a_id: string;
  profile_b_id: string;
  message: string | null;
  status: IntroStatus;
  created_at: string;
  responded_at: string | null;
};

export type Project = {
  id: string;
  profile_id: string;
  title: string;
  public_pitch: string;
  private_deck_url: string | null;
  deck_requestable: boolean;
  created_at: string;
  updated_at: string;
};

export type Chat = {
  id: string;
  profile_a_id: string;
  profile_b_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type MemberAccess = {
  id: string;
  membership_id: string;
  access_key: string;
  label: string;
  granted_at: string;
  expires_at: string | null;
  created_at: string;
};

/**
 * Moderation report — typed for backoffice UI.
 * Backend may add `public.reports`; until then actions return empty/stub.
 */
export type Report = {
  id: string;
  reporter_id: string;
  reported_profile_id: string | null;
  venue_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};

/** Aggregated venue dashboard stats (read-only). */
export type VenueDashboardStats = {
  venue_id: string;
  active_presence: number;
  visible_now: number;
  pending_verifications: number;
  verified_members: number;
  seals_issued: number;
  intros_total: number;
  connections_total: number;
  open_reports: number;
};

/** Payload for Edge Function `issue-seal`. */
export type IssueSealRequest = {
  membership_id: string;
  venue_id: string;
};

export type IssueSealResponse = {
  ok: true;
  membership: Membership;
} | {
  ok: false;
  error: string;
};

export function isStaffRole(role: UserRole): boolean {
  return role === 'staff' || role === 'admin';
}

/** Person visible in the current room (mobile discover). */
export type RoomPerson = {
  profile: Profile;
  presence: Presence;
  match?: Pick<Match, 'id' | 'score' | 'reasons'> | null;
  membership?: (Membership & { venue?: Venue | null }) | null;
};
