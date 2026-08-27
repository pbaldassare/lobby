import 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { Poppins_500Medium } from '@expo-google-fonts/poppins';
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { ThemeProvider, useTheme } from '@lobby/shared/theme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { AuthProvider } from '@/providers/AuthProvider';
import { PresenceProvider } from '@/providers/PresenceProvider';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function PushBootstrap(): null {
  usePushNotifications();
  return null;
}

/** Legge il tema, quindi deve stare dentro al provider. */
function ThemedShell(): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.color.bg.canvas }]}>
      <StatusBar style={theme.scheme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.bg.canvas },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </View>
  );
}

export default function RootLayout(): React.JSX.Element | null {
  const [loaded, error] = useFonts({
    // Facce con peso esplicito. RN su Android non sintetizza i pesi per i font
    // custom: accoppiare `fontFamily:'Inter'` a `fontWeight:'600'` rendeva
    // comunque il Regular. Ogni voce tipografica nomina una faccia concreta.
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    'PlayfairDisplay-SemiBold': PlayfairDisplay_600SemiBold,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,

    // Chiavi storiche: le usano ancora le schermate non ancora ridisegnate.
    // Si tolgono quando l'ultima passa al tema.
    SpaceGrotesk: SpaceGrotesk_700Bold,
    SpaceGrotesk_600: SpaceGrotesk_600SemiBold,
    Inter: Inter_400Regular,
    Inter_500: Inter_500Medium,
    Inter_600: Inter_600SemiBold,
    Poppins: Poppins_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Bloccato su scuro finché anche le altre schermate non passano al
            tema: seguire il sistema adesso darebbe fondo chiaro e contenuto
            scuro su tutto ciò che non è ancora migrato. Si toglie `scheme`
            quando l'ultima schermata è a posto. */}
        <ThemeProvider scheme="dark">
          <AuthProvider>
            <PresenceProvider>
              <PushBootstrap />
              <ThemedShell />
            </PresenceProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
