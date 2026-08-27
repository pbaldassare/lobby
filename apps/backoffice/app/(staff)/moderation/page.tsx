import { requireStaffPage } from '@/lib/auth/staff';
import { listVenueModeration } from '@/lib/actions/moderation';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import {
  RemoveBlockButton,
  ResolveReportButtons,
} from '@/components/ModerationActions';

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function ModerationPage({ searchParams }: Props) {
  const params = await searchParams;
  const staff = await requireStaffPage();
  const venue = pickVenue(staff.venues, params.venue);
  const mod = venue
    ? await listVenueModeration(venue.id)
    : { ok: true as const, blocks: [], reports: [] };

  return (
    <>
      <p className="kicker">Safety</p>
      <h1>Moderation</h1>
      <p>
        Staff view of selective invisibility (blocks) and reports for the venue.
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {!mod.ok ? <div className="error">{mod.error}</div> : null}

      {!venue ? (
        <div className="panel">
          <p className="muted">Select a venue to moderate.</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>Reports</h2>
            {mod.reports.length === 0 ? (
              <p className="muted">
                No reports (table may still be pending from backend — UI is
                wired).
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong style={{ color: 'var(--lobby-color-text-primary)' }}>{r.reason}</strong>
                        {r.details ? (
                          <div className="muted">{r.details}</div>
                        ) : null}
                      </td>
                      <td>
                        <span className="badge badge-warn">{r.status}</span>
                      </td>
                      <td className="muted">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td>
                        {r.status === 'open' || r.status === 'reviewing' ? (
                          <ResolveReportButtons
                            venueId={venue.id}
                            reportId={r.id}
                          />
                        ) : (
                          <span className="muted">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="panel">
            <h2>Blocks (selective invisibility)</h2>
            {mod.blocks.length === 0 ? (
              <p className="muted">No blocks involving venue members.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Blocker</th>
                    <th>Target</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.blocks.map((b) => (
                    <tr key={b.id}>
                      <td className="muted">{b.blocker_id.slice(0, 8)}…</td>
                      <td>
                        {b.blocked_profile_id
                          ? `profile ${b.blocked_profile_id.slice(0, 8)}…`
                          : (b.blocked_company ?? '—')}
                      </td>
                      <td className="muted">
                        {new Date(b.created_at).toLocaleString()}
                      </td>
                      <td>
                        <RemoveBlockButton
                          venueId={venue.id}
                          blockId={b.id}
                        />
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
