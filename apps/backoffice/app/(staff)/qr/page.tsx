import { requireStaffPage } from '@/lib/auth/staff';
import { RoomCode } from '@/components/RoomCode';
import { EventPreview } from '@/components/EventPreview';
import { listVenueRooms } from '@/lib/data/rooms';
import { getRoomPromo } from '@/lib/data/promos';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import { getMemberWebOrigin } from '@/lib/env';
import { CityLink } from '@/components/CityLink';
import { roomWindowLabel } from '@/lib/labels';
import type { PromoCopy, PromoFacts } from '@/lib/promo/types';

type Props = {
  searchParams: Promise<{ venue?: string; room?: string }>;
};

export default async function QrPage({ searchParams }: Props) {
  const params = await searchParams;
  const staff = await requireStaffPage();
  const venue = pickVenue(staff.venues, params.venue);

  let rooms: Awaited<ReturnType<typeof listVenueRooms>> = [];
  let loadError: string | null = null;
  if (venue) {
    try {
      rooms = await listVenueRooms(venue.id);
    } catch (err) {
      loadError =
        err instanceof Error ? err.message : 'Impossibile caricare le stanze.';
    }
  }

  const room = rooms.find((r) => r.id === params.room) ?? rooms[0] ?? null;

  let savedPromo: PromoCopy | null = null;
  if (venue && room) {
    try {
      savedPromo = await getRoomPromo(venue.id, room.id);
    } catch {
      savedPromo = null;
    }
  }

  const facts: PromoFacts | null =
    venue && room
      ? {
          venueId: venue.id,
          roomId: room.id,
          venueName: venue.name,
          city: venue.city,
          cityPlaceId: venue.city_place_id ?? null,
          cityLat: venue.city_lat ?? null,
          cityLng: venue.city_lng ?? null,
          roomName: room.name,
          schedule: roomWindowLabel(room.opens_at, room.closes_at),
          memberAppUrl: getMemberWebOrigin(),
        }
      : null;

  return (
    <>
      <p className="kicker">All’ingresso</p>
      <h1>QR della stanza</h1>
      <p>
        Si rinnova ogni tre minuti da solo. Tienilo su uno schermo all’ingresso:
        fotografarlo non serve a nulla il giorno dopo.
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {loadError ? <div className="error">{loadError}</div> : null}

      {venue && rooms.length > 0 ? (
        <form className="field" style={{ maxWidth: 320 }} method="get">
          <input type="hidden" name="venue" value={venue.id} />
          <label htmlFor="room">Stanza</label>
          <select id="room" name="room" defaultValue={room?.id}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost" type="submit" style={{ marginTop: 10 }}>
            Cambia stanza
          </button>
        </form>
      ) : null}

      {!venue || !room ? (
        <div className="panel">
          <p className="muted">
            {venue
              ? 'Questo locale non ha ancora stanze. Creane una in Stanze.'
              : 'Crea una stanza per avere il QR all’ingresso.'}
          </p>
        </div>
      ) : (
        <>
          <div className="section-header">
            <h2>
              {venue.name} · {room.name}
            </h2>
            <CityLink
              city={venue.city}
              placeId={venue.city_place_id}
              lat={venue.city_lat}
              lng={venue.city_lng}
            />
          </div>
          <div className="ingresso-grid">
            <div>
              <RoomCode
                venueId={venue.id}
                roomId={room.id}
                webOrigin={getMemberWebOrigin()}
              />
              <p className="muted" style={{ marginTop: 12 }}>
                Chi entra resta invisibile finché non decide di apparire, e il
                permesso scade con la stanza.
              </p>
            </div>
            {facts ? (
              <EventPreview facts={facts} initialCopy={savedPromo} />
            ) : null}
          </div>
        </>
      )}
    </>
  );
}
