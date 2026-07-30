import { colors } from '@lobby/shared/tokens';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

export default function AppLayout(): React.JSX.Element {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg.base,
        }}
      >
        <ActivityIndicator color={colors.gold.base} />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/welcome" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="join"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="member-access"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Member access',
          headerStyle: { backgroundColor: colors.bg.elevated },
          headerTintColor: colors.ink.primary,
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: true,
          title: 'Chat',
          headerStyle: { backgroundColor: colors.bg.elevated },
          headerTintColor: colors.ink.primary,
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Scan QR',
          headerStyle: { backgroundColor: colors.bg.elevated },
          headerTintColor: colors.ink.primary,
        }}
      />
    </Stack>
  );
}
