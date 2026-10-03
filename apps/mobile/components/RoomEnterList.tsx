import { makeStyles } from '@lobby/shared/theme';
import { Button, Card, Text } from '@lobby/shared/ui';
import React, { useState } from 'react';
import { View } from 'react-native';

import type { EnterableRoom } from '@/hooks/useEnterableRooms';
import { usePresence } from '@/providers/PresenceProvider';

type Props = {
  rooms: EnterableRoom[];
  onEntered?: () => void;
};

/**
 * Etichette delle stanze: un tap vale come inquadrare il QR
 * (ingresso da socio col sigillo; se manca, mail del venue).
 */
export function RoomEnterList({ rooms, onEntered }: Props): React.JSX.Element | null {
  const styles = useStyles();
  const { enterRoom } = usePresence();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (rooms.length === 0) return null;

  const go = async (room: EnterableRoom) => {
    setBusyId(room.id);
    setError(null);
    const membership = await enterRoom(room.id, { claimMembership: true });
    if (membership.error) {
      const email = await enterRoom(room.id, { claimEmail: true });
      if (email.error) {
        setError(email.error);
        setBusyId(null);
        return;
      }
    }
    setBusyId(null);
    onEntered?.();
  };

  return (
    <View style={styles.stack}>
      <Text variant="tiny" tone="tertiary">
        Tocca una stanza per entrare. Stesso permesso del QR all’ingresso.
      </Text>
      {rooms.map((room) => {
        const venue = room.venue?.name ?? 'Locale';
        const city = room.venue?.city;
        return (
          <Card key={room.id} variant="ice" style={styles.card}>
            <Text variant="tiny" tone="accent">
              QR · socio · mail
            </Text>
            <Text variant="bodyStrong">
              {venue} · {room.name}
            </Text>
            {city ? (
              <Text variant="tiny" tone="tertiary">
                {city}
              </Text>
            ) : null}
            <Button
              label={busyId === room.id ? 'Entro…' : 'Entra in questa stanza'}
              loading={busyId === room.id}
              disabled={busyId !== null && busyId !== room.id}
              onPress={() => void go(room)}
            />
          </Card>
        );
      })}
      {error ? (
        <Text variant="tiny" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  stack: { gap: 10 },
  card: { gap: 6, padding: 14 },
}));
