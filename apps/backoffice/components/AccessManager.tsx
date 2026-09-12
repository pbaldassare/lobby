'use client';

import { useState, useTransition } from 'react';
import type { AccessMethod, RoomAccess } from '@lobby/shared';
import {
  addRoomAccessAction,
  grantPassAction,
  removeRoomAccessAction,
} from '@/lib/actions/access';

const METHODS: { value: AccessMethod; label: string; needsParam: boolean }[] = [
  { value: 'qr', label: 'QR a rotazione', needsParam: false },
  { value: 'wifi_portal', label: 'Rete Wi‑Fi', needsParam: true },
  { value: 'email_domain', label: 'Dominio email', needsParam: true },
  { value: 'invite', label: 'Invito', needsParam: false },
  { value: 'membership', label: 'Socio col sigillo', needsParam: false },
];

export function AccessManager({
  venueId,
  roomId,
  channels,
}: {
  venueId: string;
  roomId: string;
  channels: RoomAccess[];
}) {
  const [method, setMethod] = useState<AccessMethod>('email_domain');
  const [param, setParam] = useState('');
  const [guestId, setGuestId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const needsParam = METHODS.find((m) => m.value === method)?.needsParam ?? false;

  return (
    <div className="stack">
      {error ? <div className="error">{error}</div> : null}

      <table className="table">
        <thead>
          <tr>
            <th>Canale</th>
            <th>Parametro</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {channels.length === 0 ? (
            <tr>
              <td colSpan={3} className="muted">
                Nessun canale. Senza canali la stanza non si apre.
              </td>
            </tr>
          ) : (
            channels.map((c) => (
              <tr key={c.id}>
                <td>{c.method}</td>
                <td>{c.param ?? '—'}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={pending}
                    onClick={() => {
                      setError(null);
                      start(async () => {
                        const res = await removeRoomAccessAction({
                          venueId,
                          accessId: c.id,
                        });
                        if (!res.ok) setError(res.error);
                      });
                    }}
                  >
                    Togli
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <form
        className="field"
        style={{ maxWidth: 420 }}
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          start(async () => {
            const res = await addRoomAccessAction({
              venueId,
              roomId,
              method,
              param: needsParam ? param : undefined,
            });
            if (!res.ok) setError(res.error);
            else setParam('');
          });
        }}
      >
        <label htmlFor="method">Apri un canale</label>
        <select
          id="method"
          value={method}
          onChange={(event) => setMethod(event.target.value as AccessMethod)}
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        {needsParam ? (
          <>
            <label htmlFor="param" style={{ marginTop: 10 }}>
              {method === 'email_domain' ? 'Dominio (es. sohohouse.com)' : 'Codice rete'}
            </label>
            <input
              id="param"
              value={param}
              onChange={(event) => setParam(event.target.value)}
              placeholder={method === 'email_domain' ? 'azienda.com' : 'lobby-house'}
            />
          </>
        ) : null}
        <button className="btn btn-gold" type="submit" disabled={pending} style={{ marginTop: 12 }}>
          {pending ? 'Salvo…' : 'Aggiungi canale'}
        </button>
      </form>

      <form
        className="field"
        style={{ maxWidth: 420, marginTop: 24 }}
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          start(async () => {
            const res = await grantPassAction({
              venueId,
              roomId,
              profileId: guestId.trim(),
            });
            if (!res.ok) setError(res.error);
            else setGuestId('');
          });
        }}
      >
        <label htmlFor="guest">Invito staff (UUID profilo)</label>
        <input
          id="guest"
          value={guestId}
          onChange={(event) => setGuestId(event.target.value)}
          placeholder="uuid del ospite"
        />
        <button className="btn btn-ghost" type="submit" disabled={pending || !guestId.trim()} style={{ marginTop: 12 }}>
          Rilascia permesso
        </button>
      </form>
    </div>
  );
}
