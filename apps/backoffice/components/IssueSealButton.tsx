'use client';

import { useState, useTransition } from 'react';
import {
  issueSealAction,
  rejectMembershipAction,
} from '@/lib/actions/seals';

type Props = { membershipId: string; venueId: string };

export function IssueSealButton({ membershipId, venueId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="row-actions">
      <button
        type="button"
        className="btn btn-gold"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await issueSealAction({
              membership_id: membershipId,
              venue_id: venueId,
            });
            if (!res.ok) setError(res.error);
          });
        }}
      >
        {pending ? 'Issuing…' : 'Verify & issue seal'}
      </button>
      <button
        type="button"
        className="btn btn-danger"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await rejectMembershipAction({
              membership_id: membershipId,
              venue_id: venueId,
            });
            if (!res.ok) setError(res.error);
          });
        }}
      >
        Reject
      </button>
      {error ? (
        <span className="error" style={{ margin: 0 }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
