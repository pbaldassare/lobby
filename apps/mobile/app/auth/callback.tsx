import { useTheme } from '@lobby/shared/theme';
import { Button, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { consumePendingDeepLink } from '@/lib/join';
import { useAuth } from '@/providers/AuthProvider';

/** OAuth return (`/auth/callback?code=`). Session is read from the URL by supabase-js. */
export default function AuthCallbackScreen(): React.JSX.Element {
  const theme = useTheme();
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (!consumePendingDeepLink()) {
        router.replace('/(app)/(tabs)/discover');
      }
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [user, loading]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.color.bg.canvas,
        padding: 24,
        gap: 14,
      }}
    >
      {!timedOut ? <ActivityIndicator color={theme.color.accent.default} /> : null}
      <Text variant="titleSm">{timedOut ? 'Accesso non riuscito' : 'Sto completando l’accesso'}</Text>
      <Text variant="body" tone="secondary" style={{ textAlign: 'center' }}>
        {timedOut
          ? 'Il provider non ha restituito una sessione. Riprova da Accedi.'
          : 'Un momento: stiamo aprendo Lobby.'}
      </Text>
      {timedOut ? (
        <Button label="Torna all’accesso" onPress={() => router.replace('/(auth)/welcome')} />
      ) : null}
    </View>
  );
}
