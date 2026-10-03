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
      <p className="kicker">Panoramica</p>
      <h1>Il venue in numeri</h1>
      <p>Presenze, sigilli, presentazioni e connessioni. Sola lettura.</p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />

      {!venue ? (
        <div className="panel">
          <p className="muted">
            Nessun venue assegnato. Serve un'assegnazione in{' '}
            <code>venue_staff</code> oppure il ruolo di amministratore.
          </p>
        </div>
      ) : (
        <>
          {statsResult && !statsResult.ok ? (
            <div className="error">{statsResult.error}</div>
          ) : null}
          <div className="stats">
            <div className="stat">
              <span>In stanza ora</span>
              <strong>{stats?.active_presence ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Visibili (per scelta)</span>
              <strong>{stats?.visible_now ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Da verificare</span>
              <strong>{stats?.pending_verifications ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Soci verificati</span>
              <strong>{stats?.verified_members ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Sigilli rilasciati</span>
              <strong>{stats?.seals_issued ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Presentazioni</span>
              <strong>{stats?.intros_total ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Connessioni</span>
              <strong>{stats?.connections_total ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Segnalazioni aperte</span>
              <strong>{stats?.open_reports ?? '—'}</strong>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 20 }}>
            <p className="muted" style={{ margin: 0 }}>
              Privacy: la presenza conta chi è in stanza; <em>visibile</em> è
              solo chi l'ha scelto. I sigilli li rilascia il venue, nessuno se
              li assegna da solo.
            </p>
          </div>
        </>
      )}
    </>
  );
}
