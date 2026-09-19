import type { Room } from '@lobby/shared';
import { requireVenueStaff } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';

const ROOM_COLUMNS = 'id, venue_id, name, created_at, opens_at, closes_at';

export async function listVenueRooms(venueId: string): Promise<Room[]> {
  await requireVenueStaff(venueId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_COLUMNS)
    .eq('venue_id', venueId)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Room[];
}

export async function listRoomsForVenues(venueIds: string[]): Promise<Room[]> {
  if (venueIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_COLUMNS)
    .in('venue_id', venueIds)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Room[];
}
