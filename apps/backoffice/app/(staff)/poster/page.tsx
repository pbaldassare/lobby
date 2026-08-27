import QRCode from 'qrcode';
import { buildRoomJoinUrl } from '@lobby/shared';
import { requireStaffPage } from '@/lib/auth/staff';
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
      loadError = err instanceof Error ? err.message : 'Failed to load rooms';
    }
  }

  const room = rooms.find((r) => r.id === params.room) ?? rooms[0] ?? null;
  let qrDataUrl: string | null = null;
  let joinUrl: string | null = null;

  if (venue && room) {
    joinUrl = buildRoomJoinUrl({
      venueId: venue.id,
      roomId: room.id,
      webOrigin: getAppOrigin(),
    });
    qrDataUrl = await QRCode.toDataURL(joinUrl, {
      width: 440,
      margin: 1,
      // Scuro su bianco a prescindere dal tema: è un codice da
      // scansionare e verrà stampato su carta.
      color: { dark: '#0B0B0C', light: '#ffffff' },
    });
  }

  return (
    <>
      <p className="kicker">On-site</p>
      <h1>QR poster</h1>
      <p>Printable “scan to join the room” for your venue entrance.</p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {loadError ? <div className="error">{loadError}</div> : null}

      {venue && rooms.length > 0 ? (
        <form className="field" style={{ maxWidth: 320 }} method="get">
          <input type="hidden" name="venue" value={venue.id} />
          <label htmlFor="room">Room</label>
          <select id="room" name="room" defaultValue={room?.id}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost" type="submit" style={{ marginTop: 10 }}>
            Update poster
          </button>
        </form>
      ) : null}

      {!venue || !room || !qrDataUrl || !joinUrl ? (
        <div className="panel">
          <p className="muted">
            {venue
              ? 'No rooms for this venue yet. Seed at least one room.'
              : 'Select a venue to generate a poster.'}
          </p>
        </div>
      ) : (
        <div className="poster">
          <div className="brand">Lobby</div>
          <p className="kicker" style={{ marginTop: 12 }}>
            Scan to join the room
          </p>
          <h2>{venue.name}</h2>
          <p style={{ color: 'var(--lobby-color-text-primary)' }}>
            {room.name} · {venue.city}
          </p>
          <div className="qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={`QR join ${venue.name} ${room.name}`} />
          </div>
          <p className="muted" style={{ wordBreak: 'break-all' }}>
            {joinUrl}
          </p>
          <p className="muted">
            Visibility stays off until the guest opts in inside the room.
          </p>
        </div>
      )}
    </>
  );
}
