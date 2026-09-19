import { requireVenueStaff } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';

export type StaffPresenceRow = {
  room_id: string;
  room_name: string;
  profile_id: string;
  display_name: string | null;
  is_visible: boolean;
  entered_at: string;
};

export type StaffConnectionRow = {
  signal_id: string;
  from_profile_id: string;
  to_profile_id: string;
  from_name: string | null;
  to_name: string | null;
  connected_at: string;
};

export async function listVenuePresence(
  venueId: string,
): Promise<StaffPresenceRow[]> {
  await requireVenueStaff(venueId);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('staff_list_presence', {
    p_venue_id: venueId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffPresenceRow[];
}

export async function listVenueConnections(
  venueId: string,
): Promise<StaffConnectionRow[]> {
  await requireVenueStaff(venueId);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('staff_list_connections', {
    p_venue_id: venueId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffConnectionRow[];
}
