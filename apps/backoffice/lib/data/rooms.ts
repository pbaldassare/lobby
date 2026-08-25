import type { Room } from '@lobby/shared';
import { requireVenueStaff } from '@/lib/auth/staff';
import { createAdminClient } from '@/lib/supabase/admin';

export async function listVenueRooms(venueId: string): Promise<Room[]> {
  await requireVenueStaff(venueId);
  const admin = createAdminClient();
  const { data } = await admin
    .from('rooms')
    .select('*')
    .eq('venue_id', venueId)
    .order('name');
  return (data ?? []) as Room[];
}
