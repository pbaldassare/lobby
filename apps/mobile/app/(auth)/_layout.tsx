import { useTheme } from '@lobby/shared/theme';
import { Redirect, Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout(): React.JSX.Element {
  const { user, loading } = useAuth();
  const theme = useTheme();
  if (!loading && user) return <Redirect href="/(app)/(tabs)/discover" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.color.bg.canvas },
      }}
    />
  );
}
