import { makeStyles, useTheme } from '@lobby/shared/theme';
import { Button, Text } from '@lobby/shared/ui';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { usePresence } from '@/providers/PresenceProvider';

/**
 * Deep link: lobby://join?venue=…&room=…
 * Si entra invisibili: la visibilità è una scelta successiva.
 */
export default function JoinScreen(): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const { enterRoom } = usePresence();
  const params = useLocalSearchParams<{ venue?: string; room?: string }>();
  const roomId = typeof params.room === 'string' ? params.room : '';
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    setJoining(true);
    void enterRoom(roomId).then(({ error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err);
        setJoining(false);
        return;
      }
      router.replace('/(app)/(tabs)/discover');
    });
    return () => {
      cancelled = true;
    };
  }, [roomId, enterRoom]);

  if (!roomId) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text variant="titleLg">Stanza non trovata</Text>
          <Text variant="body" tone="secondary">
            Il link non contiene una stanza. Scansiona il QR del locale.
          </Text>
          <Button label="Scansiona il QR" onPress={() => router.replace('/(app)/scan')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        {joining && !error ? <ActivityIndicator color={theme.color.accent.default} /> : null}
        <Text variant="titleLg">{error ? 'Non ci siamo' : 'Sto entrando'}</Text>
        <Text variant="body" tone="secondary">
          {error ?? 'Entri invisibile. La visibilità la attivi tu, una volta dentro.'}
        </Text>
        {error ? (
          <Button
            label="Vai alla stanza"
            onPress={() => router.replace('/(app)/(tabs)/discover')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  center: { gap: 14, paddingVertical: 32 },
}));
