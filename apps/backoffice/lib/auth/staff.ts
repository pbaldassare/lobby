import { redirect } from 'next/navigation';
import type { Profile, UserRole, Venue, VenueStaff } from '@lobby/shared';
import { isStaffRole } from '@lobby/shared';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type StaffContext = {
  userId: string;
  profile: Profile;
  venues: Venue[];
  assignments: VenueStaff[];
};

export class StaffAuthError extends Error {
  readonly code: 'unauthenticated' | 'forbidden' | 'venue_forbidden';

  constructor(code: StaffAuthError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'StaffAuthError';
  }
}

function asProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    role: row.role as UserRole,
    display_name: (row.display_name as string | null) ?? null,
    headline: (row.headline as string | null) ?? null,
    spotlight: (row.spotlight as string | null) ?? null,
    offer: Array.isArray(row.offer) ? (row.offer as string[]) : [],
    seek: Array.isArray(row.seek) ? (row.seek as string[]) : [],
    company: (row.company as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/** Soft check for middleware / layouts. */
export async function getStaffContext(): Promise<StaffContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let profileRow: Record<string, unknown> | null = null;
  const { data: ownProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (ownProfile) {
    profileRow = ownProfile as Record<string, unknown>;
  } else {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      profileRow = (data as Record<string, unknown> | null) ?? null;
    } catch {
      return null;
    }
  }

  if (!profileRow) return null;
  const profile = asProfile(profileRow);
  if (!isStaffRole(profile.role)) return null;

  // Own venue_staff + venues are readable under RLS. Do not require service_role
  // for the dashboard shell — missing SERVICE_ROLE used to wipe assignments.
  const { data: staffRows } = await supabase
    .from('venue_staff')
    .select('*')
    .eq('profile_id', user.id);
  const assignments = (staffRows ?? []) as VenueStaff[];

  let venues: Venue[] = [];
  if (profile.role === 'admin') {
    const { data: allVenues } = await supabase.from('venues').select('*').order('name');
    venues = (allVenues ?? []) as Venue[];
  } else {
    const venueIds = assignments.map((a) => a.venue_id);
    if (venueIds.length > 0) {
      const { data: venueRows } = await supabase
        .from('venues')
        .select('*')
        .in('id', venueIds)
        .order('name');
      venues = (venueRows ?? []) as Venue[];
    }
  }

  return { userId: user.id, profile, venues, assignments };
}

export async function requireStaffPage(): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) redirect('/login?error=forbidden');
  return ctx;
}

/** Per-action gate: staff|admin + venue scope. Call on EVERY privileged action. */
export async function requireVenueStaff(venueId: string): Promise<StaffContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new StaffAuthError('unauthenticated', 'Devi fare l’accesso.');
  }

  const ctx = await getStaffContext();
  if (!ctx) {
    throw new StaffAuthError(
      'forbidden',
      'Serve il ruolo staff o amministratore — i membri non accedono al back-office',
    );
  }

  const hasAssignment = ctx.assignments.some((a) => a.venue_id === venueId);
  const isGlobalAdmin = ctx.profile.role === 'admin';
  if (!hasAssignment && !isGlobalAdmin) {
    throw new StaffAuthError('venue_forbidden', 'Non sei autorizzato per questo venue');
  }
  return ctx;
}
