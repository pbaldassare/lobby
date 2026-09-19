import type { Membership, Profile } from '@lobby/shared';
import { requireVenueStaff } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';

export type MembershipWithProfile = Membership & {
  profile: Pick<
    Profile,
    'id' | 'display_name' | 'headline' | 'company' | 'avatar_url'
  > | null;
};

export async function listVenueMemberships(
  venueId: string,
  status?: Membership['verified_status'],
): Promise<MembershipWithProfile[]> {
  await requireVenueStaff(venueId);
  const supabase = await createClient();

  let query = supabase
    .from('memberships')
    .select('*')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('verified_status', status);

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);
  const list = (rows ?? []) as Membership[];
  const profileIds = list.map((m) => m.profile_id);

  const { data: profiles, error: profileErr } = profileIds.length
    ? await supabase
        .from('profiles')
        .select('id, display_name, headline, company, avatar_url')
        .in('id', profileIds)
    : { data: [] as { id: string }[], error: null };

  if (profileErr) throw new Error(profileErr.message);

  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      p as MembershipWithProfile['profile'],
    ]),
  );

  return list.map((m) => ({
    ...m,
    profile: byId.get(m.profile_id) ?? null,
  }));
}
