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
        err instanceof Error ? err.message : 'Failed to load memberships';
    }
  }

  return (
    <>
      <p className="kicker">Membership</p>
      <h1>Verify & issue seal</h1>
      <p>
        Privileged operation. The venue issues the seal via Edge Function{' '}
        <code>issue-seal</code> (server-side).
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {loadError ? <div className="error">{loadError}</div> : null}

      {!venue ? (
        <div className="panel">
          <p className="muted">Select a venue to review pending members.</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>Pending verification</h2>
            {pending.length === 0 ? (
              <p className="muted">No pending memberships.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Company</th>
                    <th>Since</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong style={{ color: 'var(--ink)' }}>
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
            <h2>Verified · sealed</h2>
            {verified.length === 0 ? (
              <p className="muted">No sealed members yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Status</th>
                    <th>Seal issued</th>
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
                          {m.verified_status}
                        </span>
                      </td>
                      <td className="muted">
                        {m.seal_issued_at
                          ? new Date(m.seal_issued_at).toLocaleString()
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
