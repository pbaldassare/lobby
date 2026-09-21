'use client';

import { useActionState } from 'react';
import {
  createInstanceAction,
  type InstanceActionResult,
} from '@/lib/actions/instances';
import { CityField } from '@/components/CityField';

const initial: InstanceActionResult | null = null;

export function CreateInstanceForm() {
  const [state, formAction, pending] = useActionState(
    createInstanceAction,
    initial,
  );

  return (
    <form action={formAction} className="panel">
      <h2>Nuova stanza</h2>
      <p className="muted">
        Un locale, una stanza, un QR all’ingresso. Chi è in lista entra da lì.
      </p>
      {state && !state.ok ? <div className="error">{state.error}</div> : null}
      {state && state.ok ? (
        <p className="muted">Stanza creata. Il QR è nella sezione QR.</p>
      ) : null}
      <div className="field">
        <label htmlFor="venue_name">Nome del locale</label>
        <input id="venue_name" name="venue_name" required />
      </div>
      <CityField id="city" />
      <div className="field">
        <label htmlFor="room_name">Nome della stanza</label>
        <input id="room_name" name="room_name" required defaultValue="Sala" />
      </div>
      <div className="field">
        <label htmlFor="opens_at">Apertura (facoltativa)</label>
        <input id="opens_at" name="opens_at" type="datetime-local" />
      </div>
      <div className="field">
        <label htmlFor="closes_at">Chiusura (facoltativa)</label>
        <input id="closes_at" name="closes_at" type="datetime-local" />
      </div>
      <button
        className="btn btn-gold"
        type="submit"
        name="create_instance"
        disabled={pending}
      >
        {pending ? 'Creo…' : 'Crea stanza'}
      </button>
    </form>
  );
}
