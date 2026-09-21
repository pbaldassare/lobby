'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getStaffContext,
  requireVenueStaff,
  StaffAuthError,
} from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';
import { geocodeCity, resolvePlaceId } from '@/lib/maps/places';

export type InstanceActionResult =
  | { ok: true; venueId: string; roomId: string }
  | { ok: false; error: string };

function optionalIso(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function createInstanceAction(
  _prev: InstanceActionResult | null,
  formData: FormData,
): Promise<InstanceActionResult> {
  const venueName = String(formData.get('venue_name') ?? '');
  const cityRaw = String(formData.get('city') ?? '');
  const roomName = String(formData.get('room_name') ?? '');
  const opensAt = optionalIso(String(formData.get('opens_at') ?? ''));
  const closesAt = optionalIso(String(formData.get('closes_at') ?? ''));
  const placeIdRaw = String(formData.get('city_place_id') ?? '').trim();
  const latRaw = String(formData.get('city_lat') ?? '').trim();
  const lngRaw = String(formData.get('city_lng') ?? '').trim();

  let venueId: string | undefined;
  let roomId: string | undefined;
  try {
    const staff = await getStaffContext();
    if (!staff) {
      return {
        ok: false,
        error: 'Serve un account staff o amministratore.',
      };
    }
    let city = cityRaw.trim();
    let placeId = placeIdRaw || null;
    let lat = latRaw ? Number(latRaw) : null;
    let lng = lngRaw ? Number(lngRaw) : null;
    if (placeId && (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng))) {
      const resolved = await resolvePlaceId(placeId);
      if (resolved) {
        city = resolved.city;
        lat = resolved.lat;
        lng = resolved.lng;
        placeId = resolved.placeId;
      }
    }
    if (!placeId || lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      const geo = await geocodeCity(city);
      if (!geo) {
        return {
          ok: false,
          error: 'Scegli una città da Google Maps.',
        };
      }
      city = geo.city;
      placeId = geo.placeId;
      lat = geo.lat;
      lng = geo.lng;
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_instance', {
      p_venue_name: venueName,
      p_city: city,
      p_room_name: roomName,
      p_opens_at: opensAt,
      p_closes_at: closesAt,
      p_city_place_id: placeId,
      p_city_lat: lat,
      p_city_lng: lng,
    });
    if (error) return { ok: false, error: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== 'object') {
      return { ok: false, error: 'Stanza non creata.' };
    }
    const created = row as { venue_id?: string; room_id?: string };
    if (!created.venue_id || !created.room_id) {
      return { ok: false, error: 'Stanza non creata.' };
    }
    venueId = created.venue_id;
    roomId = created.room_id;
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Creazione non riuscita.',
    };
  }

  if (!venueId || !roomId) {
    return { ok: false, error: 'Stanza non creata.' };
  }
  revalidatePath('/', 'layout');
  revalidatePath('/istanze');
  revalidatePath('/qr');
  redirect(`/qr?venue=${venueId}&room=${roomId}`);
}

export async function createRoomAction(
  _prev: InstanceActionResult | null,
  formData: FormData,
): Promise<InstanceActionResult> {
  const venueId = String(formData.get('venue_id') ?? '');
  const roomName = String(formData.get('room_name') ?? '');
  const opensAt = optionalIso(String(formData.get('opens_at') ?? ''));
  const closesAt = optionalIso(String(formData.get('closes_at') ?? ''));

  try {
    await requireVenueStaff(venueId);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_room', {
      p_venue_id: venueId,
      p_room_name: roomName,
      p_opens_at: opensAt,
      p_closes_at: closesAt,
    });
    if (error) return { ok: false, error: error.message };
    const roomId = typeof data === 'string' ? data : null;
    if (!roomId) return { ok: false, error: 'Stanza non creata.' };
    revalidatePath('/istanze');
    revalidatePath('/qr');
    return { ok: true, venueId, roomId };
  } catch (err) {
    if (err instanceof StaffAuthError) return { ok: false, error: err.message };
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Creazione stanza non riuscita.',
    };
  }
}
