import { colors, space, typography } from '@lobby/shared/tokens';
import { Button } from '@lobby/shared/ui';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { usePresence } from '@/providers/PresenceProvider';

/**
 * Deep link: lobby://join?venue=…&room=…
 * Enters room invisible by default.
 */
export default function JoinScreen(): React.JSX.Element {
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
        <Text style={styles.title}>Join room</Text>
        <Text style={styles.body}>
          Missing room in the link. Scan a venue poster QR instead.
        </Text>
        <Button label="Scan QR" onPress={() => router.replace('/(app)/scan')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        {joining && !error ? <ActivityIndicator color={colors.gold.base} /> : null}
        <Text style={styles.title}>Entering room</Text>
        <Text style={styles.body}>
          {error ?? 'Joining invisibly. Opt in to visibility once inside.'}
        </Text>
        {error ? (
          <Button
            label="Open discover"
            onPress={() => router.replace('/(app)/(tabs)/discover')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { gap: space.lg, paddingVertical: space['3xl'] },
  title: { ...typography.displayMd, color: colors.ink.primary },
  body: { ...typography.body, color: colors.ink.muted },
});
