import { useTheme } from '@lobby/shared/theme';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

export default function AppLayout(): React.JSX.Element {
  const { user, loading } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.color.bg.canvas,
        }}
      >
        <ActivityIndicator color={theme.color.accent.default} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/welcome" />;

  /** Le schermate con intestazione nativa usano la tipografia di sistema, non
   *  quella dei token: si tengono solo dove il titolo è puramente funzionale. */
  const nativeHeader = {
    headerShown: true,
    headerStyle: { backgroundColor: theme.color.bg.raised },
    headerTintColor: theme.color.text.primary,
    headerShadowVisible: false,
  } as const;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.color.bg.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="join" options={{ presentation: 'modal' }} />
      {/* La chat disegna la propria intestazione: le serve avatar e stato
          della connessione, che un header nativo non può mostrare. */}
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="qr" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="member-access"
        options={{ ...nativeHeader, presentation: 'modal', title: 'Accessi riservati' }}
      />
      <Stack.Screen
        name="scan"
        options={{ ...nativeHeader, presentation: 'modal', title: 'Scansiona' }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ ...nativeHeader, presentation: 'modal', title: 'Modifica profilo' }}
      />
      <Stack.Screen name="settings" options={{ ...nativeHeader, title: 'Impostazioni' }} />
      <Stack.Screen
        name="introduce"
        options={{ ...nativeHeader, presentation: 'modal', title: 'Presenta due persone' }}
      />
    </Stack>
  );
}
