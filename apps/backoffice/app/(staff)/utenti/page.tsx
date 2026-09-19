import { requireStaffPage } from '@/lib/auth/staff';
import { listMembershipsAcrossVenues } from '@/lib/data/memberships';
import { formatWhen, membershipStatusLabel } from '@/lib/labels';

export default async function UtentiPage() {
  const staff = await requireStaffPage();

  let rows: Awaited<ReturnType<typeof listMembershipsAcrossVenues>> = [];
  let loadError: string | null = null;

  try {
    rows = await listMembershipsAcrossVenues(staff.venues);
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : 'Impossibile caricare gli utenti registrati.';
  }

  return (
    <>
      <p className="kicker">Anagrafica</p>
      <h1>Utenti</h1>
      <p>
        Elenco dei registrati sui locali che puoi gestire. L’etichetta è nome +
        email; il sigillo resta del venue.
      </p>
      {loadError ? <div className="error">{loadError}</div> : null}

      <div className="panel">
        <h2>
          {rows.length === 1
            ? '1 registrato'
            : `${rows.length} registrati`}
        </h2>
        {rows.length === 0 ? (
          <p className="muted">Nessun utente in lista sui tuoi locali.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Etichetta</th>
                  <th>Locale</th>
                  <th>Stato</th>
                  <th>Dal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={`${m.id}-${m.venue_id}`}>
                    <td>
                      <strong
                        style={{ color: 'var(--lobby-color-text-primary)' }}
                      >
                        {m.profile?.display_name ?? m.profile_id.slice(0, 8)}
                      </strong>
                      {m.email ? <div className="muted">{m.email}</div> : null}
                      {m.profile?.headline ? (
                        <div className="muted">{m.profile.headline}</div>
                      ) : null}
                    </td>
                    <td>{m.venue_name}</td>
                    <td>
                      <span
                        className={
                          m.verified_status === 'verified'
                            ? 'badge badge-green'
                            : 'badge'
                        }
                      >
                        {membershipStatusLabel(m.verified_status)}
                      </span>
                    </td>
                    <td className="muted">
                      {m.since ? formatWhen(m.since) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
