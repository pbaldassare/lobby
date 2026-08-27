import { useTheme } from '@lobby/shared/theme';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

export default function Index(): React.JSX.Element {
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

  return <Redirect href={user ? '/(app)/(tabs)/discover' : '/(auth)/welcome'} />;
}
