import { requireStaffPage } from '@/lib/auth/staff';
import { listVenueModeration } from '@/lib/actions/moderation';
import { pickVenue } from '@/lib/venue-selection';
import { VenuePicker } from '@/components/VenuePicker';
import {
  RemoveBlockButton,
  ResolveReportButtons,
} from '@/components/ModerationActions';
import { formatWhen, reportStatusLabel } from '@/lib/labels';

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
      <p className="kicker">Sicurezza</p>
      <h1>Moderazione</h1>
      <p>
        Vista staff di invisibilità selettiva (blocchi) e segnalazioni del
        venue.
      </p>
      <VenuePicker venues={staff.venues} selectedId={venue?.id ?? null} />
      {!mod.ok ? <div className="error">{mod.error}</div> : null}

      {!venue ? (
        <div className="panel">
          <p className="muted">Scegli un venue da moderare.</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>Segnalazioni</h2>
            {mod.reports.length === 0 ? (
              <p className="muted">Nessuna segnalazione.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Motivo</th>
                    <th>Stato</th>
                    <th>Creata</th>
                    <th>Azioni</th>
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
                        <span className="badge badge-warn">
                          {reportStatusLabel(r.status)}
                        </span>
                      </td>
                      <td className="muted">{formatWhen(r.created_at)}</td>
                      <td>
                        {r.status === 'open' || r.status === 'reviewing' ? (
                          <ResolveReportButtons
                            venueId={venue.id}
                            reportId={r.id}
                          />
                        ) : (
                          <span className="muted">Chiusa</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="panel">
            <h2>Blocchi (invisibilità selettiva)</h2>
            {mod.blocks.length === 0 ? (
              <p className="muted">Nessun blocco che coinvolge i membri del venue.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Chi nasconde</th>
                    <th>Bersaglio</th>
                    <th>Creato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.blocks.map((b) => (
                    <tr key={b.id}>
                      <td className="muted">{b.blocker_id.slice(0, 8)}…</td>
                      <td>
                        {b.blocked_profile_id
                          ? `profilo ${b.blocked_profile_id.slice(0, 8)}…`
                          : (b.blocked_company ?? '—')}
                      </td>
                      <td className="muted">{formatWhen(b.created_at)}</td>
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
