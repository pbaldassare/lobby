import { NextResponse } from 'next/server';
import { getStaffContext } from '@/lib/auth/staff';
import { fetchStaticMapPng } from '@/lib/maps/places';

export async function GET(request: Request): Promise<NextResponse> {
  const staff = await getStaffContext();
  if (!staff) {
    return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Coordinate non valide.' }, { status: 400 });
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Coordinate non valide.' }, { status: 400 });
  }

  try {
    const png = await fetchStaticMapPng(lat, lng);
    return new NextResponse(Buffer.from(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mappa non disponibile.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
