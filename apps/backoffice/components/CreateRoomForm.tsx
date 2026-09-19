'use client';

import { useActionState } from 'react';
import {
  createRoomAction,
  type InstanceActionResult,
} from '@/lib/actions/instances';

const initial: InstanceActionResult | null = null;

export function CreateRoomForm({ venueId }: { venueId: string }) {
  const [state, formAction, pending] = useActionState(createRoomAction, initial);

  return (
    <form action={formAction}>
      <input type="hidden" name="venue_id" value={venueId} />
      {state && !state.ok ? <div className="error">{state.error}</div> : null}
      <div className="field">
        <label htmlFor={`room_name_${venueId}`}>Nuova stanza</label>
        <input id={`room_name_${venueId}`} name="room_name" required />
      </div>
      <div className="field">
        <label htmlFor={`opens_${venueId}`}>Apertura (facoltativa)</label>
        <input id={`opens_${venueId}`} name="opens_at" type="datetime-local" />
      </div>
      <div className="field">
        <label htmlFor={`closes_${venueId}`}>Chiusura (facoltativa)</label>
        <input id={`closes_${venueId}`} name="closes_at" type="datetime-local" />
      </div>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? 'Aggiungo…' : 'Aggiungi stanza'}
      </button>
    </form>
  );
}
