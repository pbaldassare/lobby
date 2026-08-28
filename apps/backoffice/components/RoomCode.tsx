'use client';

import { buildRoomJoinUrl } from '@lobby/shared';
import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

type Code = { code: string; expires_in: number };

/**
 * Il codice esposto all'ingresso.
 *
 * Prima il poster stampava un link fisso: fotografarlo equivaleva ad avere le
 * chiavi per sempre. Ora il codice si ricalcola dal segreto della stanza e
 * dalla finestra temporale corrente, quindi vale pochi minuti e questa pagina
 * lo rinnova da sola. Il segreto non arriva mai al browser: si chiede al
 * server il codice del momento, non la chiave per generarlo.
 */
export function RoomCode({
  venueId,
  roomId,
  webOrigin,
}: {
  venueId: string;
  roomId: string;
  webOrigin: string;
}) {
  const [code, setCode] = useState<Code | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase.rpc('current_room_code', {
      p_room_id: roomId,
    });

    if (err) {
      setError(err.message);
      return;
    }
    const next = Array.isArray(data) ? (data[0] as Code | undefined) : (data as Code | null);
    if (!next) {
      setError('Nessun codice per questa stanza');
      return;
    }

    setError(null);
    setCode(next);
    setLeft(next.expires_in);

    setQr(
      await QRCode.toDataURL(
        buildRoomJoinUrl({ venueId, roomId, code: next.code, webOrigin }),
        {
          width: 440,
          margin: 1,
          // Scuro su bianco: è un codice da leggere, non un elemento grafico.
          color: { dark: '#0B0B0C', light: '#ffffff' },
        },
      ),
    );
  }, [roomId, venueId, webOrigin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          void refresh();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [refresh]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!code || !qr) {
    return (
      <div className="poster">
        <div className="skeleton" style={{ height: 220, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '60%', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="poster">
      <p className="kicker">Inquadra per entrare</p>
      <h2>Sei invisibile finché non decidi tu</h2>
      <div className="qr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt={`Codice di accesso ${code.code}`} />
      </div>
      <p
        style={{
          fontFamily: 'var(--lobby-font-display), Georgia, serif',
          fontSize: '2rem',
          letterSpacing: '0.22em',
          margin: '0 0 4px',
          color: 'var(--lobby-color-text-primary)',
        }}
      >
        {code.code}
      </p>
      <p className="muted" style={{ margin: 0 }}>
        Si rinnova fra {left}s · chi lo fotografa non entra domani
      </p>
    </div>
  );
}
