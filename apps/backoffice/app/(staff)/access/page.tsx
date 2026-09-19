import { requireStaffPage } from '@/lib/auth/staff';
import { listRoomAccess } from '@/lib/actions/access';
import { listVenueRooms } from '@/lib/data/rooms';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import { AccessManager } from '@/components/AccessManager';

type Props = {
  searchParams: Promise<{ venue?: string; room?: string }>;
};

export default async function AccessPage({ searchParams }: Props) {
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
  const channels = room ? await listRoomAccess(room.id) : [];

  return (
    <>
      <p className="kicker">Perimetro</p>
      <h1>Canali di accesso</h1>
      <p>
        Il perimetro non è un luogo: è una prova che scade. QR, Wi‑Fi, dominio
        email, invito e sigillo rilasciano lo stesso permesso.
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
              ? 'Questo venue non ha ancora stanze.'
              : 'Scegli un venue per aprire i canali.'}
          </p>
        </div>
      ) : (
        <div className="panel">
          <h2>
            {venue.name} · {room.name}
          </h2>
          <AccessManager venueId={venue.id} roomId={room.id} channels={channels} />
        </div>
      )}
    </>
  );
}
