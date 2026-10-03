import { requireStaffPage } from '@/lib/auth/staff';
import { listVenueMemberships } from '@/lib/data/memberships';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import { IssueSealButton } from '@/components/IssueSealButton';

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function VerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  const staff = await requireStaffPage();
  const venue = pickVenue(staff.venues, params.venue);

  let pending: Awaited<ReturnType<typeof listVenueMemberships>> = [];
  let verified: Awaited<ReturnType<typeof listVenueMemberships>> = [];
  let loadError: string | null = null;

  if (venue) {
    try {
      pending = await listVenueMemberships(venue.id, 'pending');
      verified = await listVenueMemberships(venue.id, 'verified');
    } catch (err) {
      loadError =
        err instanceof Error ? err.message : 'Non riesco a caricare le iscrizioni';
    }
  }

  return (
    <>
      <p className="kicker">Iscrizioni</p>
      <h1>Verifica e rilascia il sigillo</h1>
      <p>
        Operazione riservata. Il sigillo lo rilascia il venue, lato server,
        tramite la funzione <code>issue-seal</code>.
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {loadError ? <div className="error">{loadError}</div> : null}

      {!venue ? (
        <div className="panel">
          <p className="muted">Scegli un venue per vedere chi è in attesa.</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>In attesa di verifica</h2>
            {pending.length === 0 ? (
              <p className="muted">Nessuna iscrizione in attesa.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Azienda</th>
                    <th>Dal</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong style={{ color: 'var(--lobby-color-text-primary)' }}>
                          {m.profile?.display_name ?? m.profile_id.slice(0, 8)}
                        </strong>
                        {m.profile?.headline ? (
                          <div className="muted">{m.profile.headline}</div>
                        ) : null}
                      </td>
                      <td>{m.profile?.company ?? '—'}</td>
                      <td>{m.since}</td>
                      <td>
                        <IssueSealButton
                          membershipId={m.id}
                          venueId={venue.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="panel">
            <h2>Verificati · con sigillo</h2>
            {verified.length === 0 ? (
              <p className="muted">Ancora nessun socio con sigillo.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Stato</th>
                    <th>Sigillo rilasciato</th>
                  </tr>
                </thead>
                <tbody>
                  {verified.map((m) => (
                    <tr key={m.id}>
                      <td>
                        {m.profile?.display_name ?? m.profile_id.slice(0, 8)}
                      </td>
                      <td>
                        <span className="badge badge-green">
                          {m.verified_status === 'verified' ? 'verificato' : m.verified_status}
                        </span>
                      </td>
                      <td className="muted">
                        {m.seal_issued_at
                          ? new Date(m.seal_issued_at).toLocaleString('it-IT')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
