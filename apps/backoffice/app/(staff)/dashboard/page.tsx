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
      <h1>Dashboard del venue</h1>
      <p>
        Riepilogo in sola lettura di presenze, sigilli, intro e connessioni.
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />

      {!venue ? (
        <div className="panel">
          <p className="muted">
            Nessun venue in carico. Serve un assegnamento staff sul locale
            (oppure il ruolo amministratore).
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
              <span>Visibili (a scelta)</span>
              <strong>{stats?.visible_now ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>In attesa di verifica</span>
              <strong>{stats?.pending_verifications ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Membri verificati</span>
              <strong>{stats?.verified_members ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Sigilli rilasciati</span>
              <strong>{stats?.seals_issued ?? '—'}</strong>
            </div>
            <div className="stat">
              <span>Intro</span>
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
              solo a scelta. I sigilli li rilascia il venue, mai l’utente.
            </p>
          </div>
        </>
      )}
    </>
  );
}
