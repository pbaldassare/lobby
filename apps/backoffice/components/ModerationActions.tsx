'use client';

import { useState, useTransition } from 'react';
import {
  removeBlockAction,
  resolveReportAction,
} from '@/lib/actions/moderation';

export function ResolveReportButtons({
  venueId,
  reportId,
}: {
  venueId: string;
  reportId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="row-actions">
      <button
        type="button"
        className="btn btn-gold"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await resolveReportAction({
              venue_id: venueId,
              report_id: reportId,
              status: 'resolved',
            });
            if (!res.ok) setError(res.error);
          })
        }
      >
        Risolvi
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await resolveReportAction({
              venue_id: venueId,
              report_id: reportId,
              status: 'dismissed',
            });
            if (!res.ok) setError(res.error);
          })
        }
      >
        Archivia
      </button>
      {error ? <span className="muted">{error}</span> : null}
    </div>
  );
}

export function RemoveBlockButton({
  venueId,
  blockId,
}: {
  venueId: string;
  blockId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await removeBlockAction({
              venue_id: venueId,
              block_id: blockId,
            });
            if (!res.ok) setError(res.error);
          })
        }
      >
        Rimuovi
      </button>
      {error ? <span className="muted">{error}</span> : null}
    </>
  );
}
