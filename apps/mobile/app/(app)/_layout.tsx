import { useTheme } from '@lobby/shared/theme';
import { Icon } from '@lobby/shared/ui';
import { Redirect, router, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

/**
 * Freccia indietro per il web.
 *
 * Quella di serie si annuncia col titolo della schermata precedente più
 * "back": dalle schede usciva "(tabs), back", il nome di una cartella. Su
 * iOS e Android resta quella nativa, che ha il gesto e l'etichetta giusta.
 */
function HeaderBack({ color }: { color: string }): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Indietro"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/discover'))}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {/* Il chevron guarda a destra: ruotato diventa un "indietro". */}
      <View style={{ transform: [{ rotate: '180deg' }] }}>
        <Icon name="chevronRight" size={20} color={color} />
      </View>
    </Pressable>
  );
}

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
    headerBackTitle: 'Indietro',
    ...(Platform.OS === 'web'
      ? { headerLeft: () => <HeaderBack color={theme.color.text.primary} /> }
      : null),
  } as const;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.color.bg.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ title: 'Lobby' }} />
      <Stack.Screen name="join" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="enter"
        options={{ ...nativeHeader, presentation: 'modal', title: 'Come entri' }}
      />
      <Stack.Screen
        name="invite-guest"
        options={{ ...nativeHeader, presentation: 'modal', title: 'Porta un ospite' }}
      />
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
