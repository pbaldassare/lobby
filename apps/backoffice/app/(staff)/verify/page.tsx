import { requireStaffPage } from '@/lib/auth/staff';
import { listVenueMemberships } from '@/lib/data/memberships';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import { IssueSealButton } from '@/components/IssueSealButton';
import { formatWhen, membershipStatusLabel } from '@/lib/labels';

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
        err instanceof Error ? err.message : 'Impossibile caricare le membership.';
    }
  }

  return (
    <>
      <p className="kicker">Soci</p>
      <h1>Verifica e rilascio sigillo</h1>
      <p>
        Operazione privilegiata. Il sigillo lo rilascia il venue, lato server,
        mai il membro.
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {loadError ? <div className="error">{loadError}</div> : null}

      {!venue ? (
        <div className="panel">
          <p className="muted">Scegli un venue per vedere i membri in attesa.</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>In attesa di verifica</h2>
            {pending.length === 0 ? (
              <p className="muted">Nessuna richiesta in attesa.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Membro</th>
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
                      <td>{m.since ? formatWhen(m.since) : '—'}</td>
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
            <h2>Verificati · sigillo</h2>
            {verified.length === 0 ? (
              <p className="muted">Nessun membro con sigillo.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Membro</th>
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
                          {membershipStatusLabel(m.verified_status)}
                        </span>
                      </td>
                      <td className="muted">
                        {m.seal_issued_at ? formatWhen(m.seal_issued_at) : '—'}
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
