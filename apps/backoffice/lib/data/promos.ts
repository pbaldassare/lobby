import type { PromoCopy } from '@/lib/promo/types';
import { requireVenueStaff } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';

type PromoRow = PromoCopy & { room_id: string; venue_id: string };

export async function getRoomPromo(
  venueId: string,
  roomId: string,
): Promise<PromoCopy | null> {
  await requireVenueStaff(venueId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('room_promos')
    .select(
      'headline, lede, about_lobby, purpose, how_to_enter, privacy_note, cta, schedule_line, model',
    )
    .eq('room_id', roomId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as PromoCopy;
}

export async function saveRoomPromo(
  venueId: string,
  roomId: string,
  copy: PromoCopy,
): Promise<PromoCopy> {
  await requireVenueStaff(venueId);
  const supabase = await createClient();
  const row: PromoRow = {
    room_id: roomId,
    venue_id: venueId,
    ...copy,
  };
  const { data, error } = await supabase
    .from('room_promos')
    .upsert(row, { onConflict: 'room_id' })
    .select(
      'headline, lede, about_lobby, purpose, how_to_enter, privacy_note, cta, schedule_line, model',
    )
    .single();
  if (error) throw new Error(error.message);
  return data as PromoCopy;
}
