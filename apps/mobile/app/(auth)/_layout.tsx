import { colors } from '@lobby/shared/tokens';
import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout(): React.JSX.Element {
  const { user, loading } = useAuth();
  if (!loading && user) return <Redirect href="/(app)/(tabs)/discover" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
