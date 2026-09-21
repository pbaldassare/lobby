import { NextResponse } from 'next/server';
import { getStaffContext } from '@/lib/auth/staff';
import {
  geocodeCity,
  resolvePlaceId,
  suggestCities,
} from '@/lib/maps/places';

export async function GET(request: Request): Promise<NextResponse> {
  const staff = await getStaffContext();
  if (!staff) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId')?.trim() ?? '';
  const q = searchParams.get('q')?.trim() ?? '';

  try {
    if (placeId) {
      const city = await resolvePlaceId(placeId);
      if (!city) {
        return NextResponse.json({ error: 'Città non trovata.' }, { status: 404 });
      }
      return NextResponse.json({ city });
    }
    if (q.length >= 2) {
      const suggestions = await suggestCities(q);
      return NextResponse.json({ suggestions });
    }
    if (q.length > 0) {
      const city = await geocodeCity(q);
      return NextResponse.json({ city });
    }
    return NextResponse.json({ suggestions: [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Google Maps non disponibile.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
