import { requireStaffPage } from '@/lib/auth/staff';
import { RoomCode } from '@/components/RoomCode';
import { listVenueRooms } from '@/lib/data/rooms';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import { getAppOrigin } from '@/lib/env';

type Props = {
  searchParams: Promise<{ venue?: string; room?: string }>;
};

export default async function PosterPage({ searchParams }: Props) {
  const params = await searchParams;
  const staff = await requireStaffPage();
  const venue = pickVenue(staff.venues, params.venue);

  let rooms: Awaited<ReturnType<typeof listVenueRooms>> = [];
  let loadError: string | null = null;
  if (venue) {
    try {
      rooms = await listVenueRooms(venue.id);
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Impossibile caricare le stanze.';
    }
  }

  const room = rooms.find((r) => r.id === params.room) ?? rooms[0] ?? null;

  return (
    <>
      <p className="kicker">All'ingresso</p>
      <h1>Codice della stanza</h1>
      <p>
        Si rinnova ogni tre minuti da solo. Tienilo su uno schermo all'ingresso:
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
              ? 'Questo venue non ha ancora stanze. Creane almeno una.'
              : 'Scegli un venue per generare il codice.'}
          </p>
        </div>
      ) : (
        <>
          <div className="section-header">
            <h2>
              {venue.name} · {room.name}
            </h2>
            <span className="muted">{venue.city}</span>
          </div>
          <RoomCode venueId={venue.id} roomId={room.id} webOrigin={getAppOrigin()} />
          <p className="muted" style={{ marginTop: 12 }}>
            Chi entra resta invisibile finché non decide di apparire, e il
            permesso scade con la stanza.
          </p>
        </>
      )}
    </>
  );
}
