import { colors, space, typography } from '@lobby/shared/tokens';
import { Button, Card } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { isEnvConfigured } from '@/lib/env';
import { useAuth } from '@/providers/AuthProvider';

export default function WelcomeScreen(): React.JSX.Element {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const afterAuth = (err: string | null) => {
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    // Post-login: invisible by default (PresenceProvider)
    router.replace('/(app)/(tabs)/discover');
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <Text style={styles.wordmark}>LOBBY</Text>
          <Text style={styles.tagline}>
            Appear only when you choose. Meet the right people in the room.
          </Text>
        </View>
        <Card variant="glass" style={styles.card}>
          <Text style={styles.privacy}>
            Privacy first: you stay invisible after login. Visibility is opt-in, room-only, and
            turns off when you leave.
          </Text>
          {!isEnvConfigured() ? (
            <Text style={styles.demo}>
              Demo mode — set EXPO_PUBLIC_SUPABASE_URL / ANON_KEY in apps/mobile/.env
            </Text>
          ) : null}
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.ink.muted2}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.ink.muted2}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <Button
            label={isDemo ? 'Continue (demo)' : 'Sign in with email'}
            loading={busy}
            onPress={() => {
              setBusy(true);
              setError(null);
              void signInWithEmail(email || 'demo@lobby.app', password || 'demo').then((r) =>
                afterAuth(r.error),
              );
            }}
          />
          <Button
            label="Create account"
            variant="ghost"
            onPress={() => {
              setBusy(true);
              setError(null);
              void signUpWithEmail(email || 'demo@lobby.app', password || 'demo').then((r) =>
                afterAuth(r.error),
              );
            }}
          />
          <Button
            label="Continue with Google"
            variant="ghost"
            onPress={() => {
              setBusy(true);
              setError(null);
              void signInWithOAuth('google').then((r) => afterAuth(r.error));
            }}
          />
          <Button
            label="Continue with LinkedIn"
            variant="ghost"
            onPress={() => {
              setBusy(true);
              setError(null);
              void signInWithOAuth('linkedin_oidc').then((r) => afterAuth(r.error));
            }}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: space['3xl'], marginBottom: space.xl, gap: space.md },
  wordmark: { ...typography.wordmark, color: colors.gold.base },
  tagline: { ...typography.body, color: colors.ink.muted, maxWidth: 320 },
  card: { gap: space.md },
  privacy: { ...typography.sm, color: colors.ink.muted },
  demo: { ...typography.tiny, color: colors.gold.base },
  input: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    borderRadius: 11,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: colors.ink.primary,
    ...typography.body,
  },
  error: { ...typography.sm, color: '#E88' },
});
