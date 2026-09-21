import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/staff';
import { listRoomsForVenues } from '@/lib/data/rooms';
import { CreateInstanceForm } from '@/components/CreateInstanceForm';
import { CreateRoomForm } from '@/components/CreateRoomForm';
import { roomWindowLabel } from '@/lib/labels';
import type { Room, Venue } from '@lobby/shared';

export default async function IstanzePage() {
  const staff = await requireStaffPage();

  let rooms: Room[] = [];
  let loadError: string | null = null;
  try {
    rooms = await listRoomsForVenues(staff.venues.map((v) => v.id));
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : 'Impossibile caricare le stanze.';
  }

  const roomsByVenue = new Map<string, Room[]>();
  for (const room of rooms) {
    const list = roomsByVenue.get(room.venue_id) ?? [];
    list.push(room);
    roomsByVenue.set(room.venue_id, list);
  }

  return (
    <>
      <p className="kicker">Locale e stanza</p>
      <h1>Stanze</h1>
      <p>
        Un locale, una stanza, un QR all’ingresso. Chi è in lista entra da lì;
        fuori dalla stanza non esiste.
      </p>

      <CreateInstanceForm />

      {loadError ? <div className="error">{loadError}</div> : null}

      {staff.venues.length === 0 ? (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            Nessun locale in carico. Crea la prima stanza qui sopra.
          </p>
        </div>
      ) : (
        staff.venues.map((venue) => (
          <VenueInstance
            key={venue.id}
            venue={venue}
            rooms={roomsByVenue.get(venue.id) ?? []}
          />
        ))
      )}
    </>
  );
}

function VenueInstance({ venue, rooms }: { venue: Venue; rooms: Room[] }) {
  return (
    <div className="panel">
      <div className="section-header">
        <h2>{venue.name}</h2>
        <span className="muted">{venue.city}</span>
      </div>
      {rooms.length === 0 ? (
        <p className="muted">Nessuna stanza. Aggiungine una per avere il QR.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Stanza</th>
                <th>Finestra</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    <strong style={{ color: 'var(--lobby-color-text-primary)' }}>
                      {room.name}
                    </strong>
                  </td>
                  <td className="muted">
                    {roomWindowLabel(room.opens_at, room.closes_at)}
                  </td>
                  <td>
                    <Link
                      href={`/qr?venue=${venue.id}&room=${room.id}`}
                      className="btn btn-ghost"
                      style={{ minHeight: 36, padding: '6px 12px' }}
                    >
                      QR ingresso
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <CreateRoomForm venueId={venue.id} />
      </div>
    </div>
  );
}
