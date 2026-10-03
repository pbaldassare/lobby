import { useTheme } from '@lobby/shared/theme';
import { Button, Text } from '@lobby/shared/ui';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { consumePendingDeepLink } from '@/lib/join';
import { completeNativeOAuthRedirect } from '@/lib/oauthSession';
import { useAuth } from '@/providers/AuthProvider';

function callbackHref(params: {
  code?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
}): string | null {
  const first = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  const code = first(params.code);
  const error = first(params.error);
  const description = first(params.error_description);
  if (!code && !error) return null;
  const query = new URLSearchParams();
  if (code) query.set('code', code);
  if (error) query.set('error', error);
  if (description) query.set('error_description', description);
  return `lobby://auth/callback?${query.toString()}`;
}

/** OAuth return (`/auth/callback?code=`). Web: supabase-js reads the URL. Native: PKCE exchange. */
export default function AuthCallbackScreen(): React.JSX.Element {
  const theme = useTheme();
  const { user, loading } = useAuth();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [timedOut, setTimedOut] = useState(false);
  const fromRoute = callbackHref(params);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void (async () => {
      const initial = await Linking.getInitialURL();
      const fromLink = initial && /auth\/callback/.test(initial) ? initial : null;
      const raw = fromRoute ?? fromLink;
      if (raw) await completeNativeOAuthRedirect(raw);
    })();
  }, [fromRoute]);

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
