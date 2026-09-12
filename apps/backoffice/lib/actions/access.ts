'use server';

import { revalidatePath } from 'next/cache';
import type { AccessMethod, Pass, RoomAccess } from '@lobby/shared';
import { requireVenueStaff, StaffAuthError } from '@/lib/auth/staff';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type AccessActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function listRoomAccess(roomId: string): Promise<RoomAccess[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('room_access')
    .select('*')
    .eq('room_id', roomId)
    .order('method');
  return (data ?? []) as RoomAccess[];
}

export async function addRoomAccessAction(input: {
  venueId: string;
  roomId: string;
  method: AccessMethod;
  param?: string;
}): Promise<AccessActionResult> {
  try {
    await requireVenueStaff(input.venueId);
    const admin = createAdminClient();
    const param =
      input.method === 'email_domain' || input.method === 'wifi_portal'
        ? (input.param ?? '').trim().toLowerCase()
        : null;
    if (
      (input.method === 'email_domain' || input.method === 'wifi_portal') &&
      !param
    ) {
      return { ok: false, error: 'Serve un dominio o un codice rete.' };
    }
    const { error } = await admin.from('room_access').insert({
      room_id: input.roomId,
      method: input.method,
      param,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/access');
    revalidatePath('/poster');
    return { ok: true };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : 'failed' };
  }
}

export async function removeRoomAccessAction(input: {
  venueId: string;
  accessId: string;
}): Promise<AccessActionResult> {
  try {
    await requireVenueStaff(input.venueId);
    const admin = createAdminClient();
    const { error } = await admin.from('room_access').delete().eq('id', input.accessId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/access');
    return { ok: true };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : 'failed' };
  }
}

export async function grantPassAction(input: {
  venueId: string;
  roomId: string;
  profileId: string;
  hours?: number;
}): Promise<AccessActionResult | { ok: true; pass: Pass }> {
  try {
    await requireVenueStaff(input.venueId);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('grant_pass', {
      p_room_id: input.roomId,
      p_profile_id: input.profileId,
      p_method: 'invite',
      p_hours: input.hours ?? 12,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/access');
    return { ok: true, pass: data as Pass };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : 'failed' };
  }
}
