import { makeStyles } from '@lobby/shared/theme';
import type { Room } from '@lobby/shared/types';
import { Button, Field, Text } from '@lobby/shared/ui';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { RoomEnterList } from '@/components/RoomEnterList';
import { Screen } from '@/components/Screen';
import { useEnterableRooms } from '@/hooks/useEnterableRooms';
import { useMemberships } from '@/hooks/useMemberships';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { usePresence } from '@/providers/PresenceProvider';

const SEEDED_ROOM_ID = 'a2222222-2222-4222-8222-222222222222';

/**
 * Gli altri canali del perimetro: mail del venue, socio col sigillo, rete Wi‑Fi.
 * Il QR resta il gesto principale all'ingresso; qui stai se hai già un titolo.
 */
export default function EnterScreen(): React.JSX.Element {
  const styles = useStyles();
  const { isDemo } = useAuth();
  const { enterRoom } = usePresence();
  const { memberships } = useMemberships();
  const { rooms: enterable } = useEnterableRooms();
  const params = useLocalSearchParams<{ room?: string }>();
  const [roomId, setRoomId] = useState(
    typeof params.room === 'string' && params.room.length > 0 ? params.room : SEEDED_ROOM_ID,
  );
  const [wifi, setWifi] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'email' | 'membership' | 'wifi' | null>(null);

  const sealed = memberships.filter(
    (m) => m.verified_status === 'verified' && m.seal_issued_at,
  );

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    void getSupabase()
      .from('rooms')
      .select('id, venue_id, name, created_at, opens_at, closes_at')
      .then(({ data }) => {
        if (!cancelled) setRooms((data ?? []) as Room[]);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  const go = async (kind: 'email' | 'membership' | 'wifi') => {
    setBusy(kind);
    setError(null);
    const { error: err } = await enterRoom(roomId, {
      claimEmail: kind === 'email',
      claimMembership: kind === 'membership',
      wifi: kind === 'wifi' ? wifi.trim() : undefined,
    });
    setBusy(null);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/(app)/(tabs)/discover');
  };

  return (
    <Screen>
      <View style={styles.stack}>
        <Text variant="titleLg">Come entri</Text>
        <Text variant="body" tone="secondary">
          Il perimetro è una prova che scade. QR all&apos;ingresso, mail del
          venue, sigillo da socio o rete Wi‑Fi: stesso permesso, canali diversi.
        </Text>

        <RoomEnterList
          rooms={enterable}
          onEntered={() => router.replace('/(app)/(tabs)/discover')}
        />

        {rooms.length > 1 ? (
          <View style={styles.stack}>
            <Text variant="tiny" tone="tertiary">
              Stanza
            </Text>
            {rooms.map((r) => (
              <Button
                key={r.id}
                label={r.name}
                variant={r.id === roomId ? 'gold' : 'ghost'}
                onPress={() => setRoomId(r.id)}
              />
            ))}
          </View>
        ) : null}

        <Button
          label="Entra con la mail del venue"
          loading={busy === 'email'}
          onPress={() => void go('email')}
        />
        <Text variant="tiny" tone="tertiary">
          Funziona se lo staff ha aperto la stanza al tuo dominio.
        </Text>

        <Button
          label={sealed.length ? 'Entra da socio' : 'Entra da socio (serve il sigillo)'}
          loading={busy === 'membership'}
          disabled={!isDemo && sealed.length === 0}
          onPress={() => void go('membership')}
        />

        <Field
          label="Codice rete Wi‑Fi"
          value={wifi}
          onChangeText={setWifi}
          placeholder="lobby-house"
          autoCapitalize="none"
          autoCorrect={false}
          error={busy === 'wifi' ? error : null}
        />
        <Button
          label="Entra dalla rete del locale"
          loading={busy === 'wifi'}
          disabled={wifi.trim().length === 0}
          onPress={() => void go('wifi')}
        />

        {error && busy !== 'wifi' ? (
          <Text variant="tiny" tone="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label="Scansiona il QR"
          variant="ghost"
          onPress={() => router.replace('/(app)/scan')}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  stack: { gap: 12, paddingVertical: 24 },
}));
