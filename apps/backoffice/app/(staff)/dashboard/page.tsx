import { requireStaffPage } from '@/lib/auth/staff';
import { getVenueDashboardStats } from '@/lib/actions/stats';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const staff = await requireStaffPage();
  const venue = pickVenue(staff.venues, params.venue);
  const statsResult = venue ? await getVenueDashboardStats(venue.id) : null;
  const stats = statsResult?.stats;

  return (
    <>
      <p className="kicker">Overview</p>
      <h1>Venue dashboard</h1>
      <p>Read-only aggregates for presence, seals, intros, and connections.</p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />

      {!venue ? (
        <div className="panel">
          <p className="muted">
            No venue in scope. You need a <code>venue_staff</code> assignment
            (or admin role).
          </p>
        </div>
      ) : (
        <>
          {statsResult && !statsResult.ok ? (
            <div className="error">{statsResult.error}</div>
          ) : null}
          <div className="stats">
            <div className="stat">
              <span>In room now</span>
              <strong>{stats?.active_presence ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Visible (opt-in)</span>
              <strong>{stats?.visible_now ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Pending verify</span>
              <strong>{stats?.pending_verifications ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Verified members</span>
              <strong>{stats?.verified_members ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Seals issued</span>
              <strong>{stats?.seals_issued ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Intros</span>
              <strong>{stats?.intros_total ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Connections</span>
              <strong>{stats?.connections_total ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Open reports</span>
              <strong>{stats?.open_reports ?? '—'}</strong>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 20 }}>
            <p className="muted" style={{ margin: 0 }}>
              Privacy: presence includes room occupancy; <em>visible</em> is
              opt-in only. Seals are issued by the venue, never self-asserted.
            </p>
          </div>
        </>
      )}
    </>
  );
}
