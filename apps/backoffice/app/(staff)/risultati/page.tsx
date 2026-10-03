import { requireStaffPage } from '@/lib/auth/staff';
import {
  listVenueConnections,
  listVenuePresence,
  type StaffPresenceRow,
} from '@/lib/data/results';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import { formatWhen } from '@/lib/labels';

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function RisultatiPage({ searchParams }: Props) {
  const params = await searchParams;
  const staff = await requireStaffPage();
  const venue = pickVenue(staff.venues, params.venue);

  let presence: StaffPresenceRow[] = [];
  let connections: Awaited<ReturnType<typeof listVenueConnections>> = [];
  let loadError: string | null = null;

  if (venue) {
    try {
      [presence, connections] = await Promise.all([
        listVenuePresence(venue.id),
        listVenueConnections(venue.id),
      ]);
    } catch (err) {
      loadError =
        err instanceof Error
          ? err.message
          : 'Impossibile caricare i risultati.';
    }
  }

  const visible = presence.filter((p) => p.is_visible).length;
  const rooms = groupPresence(presence);

  return (
    <>
      <p className="kicker">Dopo la serata</p>
      <h1>Risultati</h1>
      <p>
        Chi era in stanza, chi si è reso visibile, chi si è connesso. La
        visibilità vale solo nella stanza; la connessione solo per consenso
        reciproco.
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {loadError ? <div className="error">{loadError}</div> : null}

      {!venue ? (
        <div className="panel">
          <p className="muted">Crea un’istanza per vedere i risultati.</p>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <span>In stanza</span>
              <strong>{presence.length}</strong>
            </div>
            <div className="stat">
              <span>Visibili (a scelta)</span>
              <strong>{visible}</strong>
            </div>
            <div className="stat">
              <span>Connessioni</span>
              <strong>{connections.length}</strong>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <h2>Presenze</h2>
            {presence.length === 0 ? (
              <p className="muted">
                Nessuno in stanza. Il QR è all’ingresso; chi entra resta
                invisibile finché non decide di apparire.
              </p>
            ) : (
              rooms.map((group) => (
                <div key={group.roomId} style={{ marginTop: 12 }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>
                    {group.roomName}
                  </h3>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Persona</th>
                          <th>Visibilità</th>
                          <th>Entrata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => (
                          <tr key={`${row.room_id}-${row.profile_id}`}>
                            <td>
                              <strong
                                style={{
                                  color: 'var(--lobby-color-text-primary)',
                                }}
                              >
                                {row.display_name ??
                                  row.profile_id.slice(0, 8)}
                              </strong>
                            </td>
                            <td>
                              {row.is_visible ? (
                                <span className="badge badge-green">
                                  Visibile
                                </span>
                              ) : (
                                <span className="badge">Invisibile</span>
                              )}
                            </td>
                            <td className="muted">
                              {formatWhen(row.entered_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <h2>Connessioni</h2>
            {connections.length === 0 ? (
              <p className="muted">
                Nessuna connessione. Servono due sì: un segnale da solo non
                basta.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Da</th>
                      <th>A</th>
                      <th>Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((c) => (
                      <tr key={c.signal_id}>
                        <td>{c.from_name ?? c.from_profile_id.slice(0, 8)}</td>
                        <td>{c.to_name ?? c.to_profile_id.slice(0, 8)}</td>
                        <td className="muted">
                          {formatWhen(c.connected_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function groupPresence(rows: StaffPresenceRow[]): {
  roomId: string;
  roomName: string;
  rows: StaffPresenceRow[];
}[] {
  const order: string[] = [];
  const map = new Map<string, { roomName: string; rows: StaffPresenceRow[] }>();
  for (const row of rows) {
    const existing = map.get(row.room_id);
    if (existing) {
      existing.rows.push(row);
    } else {
      order.push(row.room_id);
      map.set(row.room_id, { roomName: row.room_name, rows: [row] });
    }
  }
  return order.map((roomId) => {
    const group = map.get(roomId);
    return {
      roomId,
      roomName: group?.roomName ?? roomId,
      rows: group?.rows ?? [],
    };
  });
}
