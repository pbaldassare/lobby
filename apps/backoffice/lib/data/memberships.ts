import type { Membership, Profile, VerificationStatus } from '@lobby/shared';
import { requireVenueStaff } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';

export type MembershipWithProfile = Membership & {
  email: string | null;
  profile: Pick<
    Profile,
    'id' | 'display_name' | 'headline' | 'company' | 'avatar_url'
  > | null;
};

type StaffMembershipRow = {
  membership_id: string;
  profile_id: string;
  email: string | null;
  display_name: string | null;
  headline: string | null;
  company: string | null;
  verified_status: VerificationStatus;
  since: string;
  seal_issued_at: string | null;
};

export async function listVenueMemberships(
  venueId: string,
  status?: Membership['verified_status'],
): Promise<MembershipWithProfile[]> {
  await requireVenueStaff(venueId);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('staff_list_memberships', {
    p_venue_id: venueId,
  });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as StaffMembershipRow[];
  return rows
    .filter((row) => (status ? row.verified_status === status : true))
    .map((row) => ({
      id: row.membership_id,
      profile_id: row.profile_id,
      venue_id: venueId,
      since: row.since,
      verified_status: row.verified_status,
      seal_issued_at: row.seal_issued_at,
      seal_issued_by: null,
      created_at: row.since,
      updated_at: row.since,
      email: row.email,
      profile: {
        id: row.profile_id,
        display_name: row.display_name,
        headline: row.headline,
        company: row.company,
        avatar_url: null,
      },
    }));
}
