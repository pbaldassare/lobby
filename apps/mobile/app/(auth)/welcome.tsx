import { makeStyles } from '@lobby/shared/theme';
import { Button, Field, GlyphMark, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InstallBanner } from '@/components/InstallBanner';
import { isEnvConfigured } from '@/lib/env';
import { consumePendingDeepLink } from '@/lib/join';
import type { SocialProvider } from '@/lib/oauth';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Ingresso: LinkedIn, Google e Apple iscrivono e accedono con lo stesso tasto.
 * Email resta l'alternativa. Invisibili dopo l'ingresso, in app e sul web.
 */
export default function WelcomeScreen(): React.JSX.Element {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<SocialProvider | 'email' | 'signup' | null>(null);

  const run = (
    fn: () => Promise<{ error: string | null; skipped?: boolean }>,
    key: SocialProvider | 'email' | 'signup',
    stayOnPage = false,
  ) => {
    setBusy(key);
    setError(null);
    void fn().then(({ error: err, skipped }) => {
      setBusy(null);
      if (err) {
        setError(err);
        return;
      }
      if (skipped || stayOnPage) return;
      if (!consumePendingDeepLink()) {
        router.replace('/(app)/(tabs)/discover');
      }
    });
  };

  const social = (provider: SocialProvider) =>
    run(
      () => signInWithOAuth(provider),
      provider,
      Platform.OS === 'web' && !isDemo,
    );

  const withEmail = (mode: 'email' | 'signup') => {
    const trimmed = email.trim();
    if (!isDemo && (!trimmed || !password)) {
      setError('Inserisci email e password.');
      return;
    }
    run(
      () =>
        mode === 'email'
          ? signInWithEmail(trimmed || 'demo@lobby.app', password || 'demo')
          : signUpWithEmail(trimmed || 'demo@lobby.app', password || 'demo'),
      mode,
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <GlyphMark name="lock" size={56} />
          <Text variant="titleLg" style={styles.wordmark}>
            Accedi o iscriviti
          </Text>
          <Text variant="body" tone="secondary" style={styles.tagline}>
            Un tasto per entrare la prima volta e le successive. Appari solo
            quando lo decidi tu.
          </Text>
        </View>

        <View style={styles.form}>
          <Text variant="small" tone="secondary">
            Resti invisibile anche dopo l&apos;accesso. La visibilità si attiva a
            mano, vale solo nella stanza in cui sei e si spegne quando esci.
          </Text>

          {!isEnvConfigured() ? (
            <View style={styles.demo}>
              <Text variant="tiny" tone="accent">
                Modalità dimostrativa · dati finti, nessun database collegato
              </Text>
            </View>
          ) : null}

          <Button
            label="Accedi o iscriviti con LinkedIn"
            loading={busy === 'linkedin_oidc'}
            disabled={busy !== null && busy !== 'linkedin_oidc'}
            onPress={() => social('linkedin_oidc')}
          />
          <Button
            label="Accedi o iscriviti con Google"
            variant="ghost"
            loading={busy === 'google'}
            disabled={busy !== null && busy !== 'google'}
            onPress={() => social('google')}
          />
          <Button
            label="Accedi o iscriviti con Apple"
            variant="ghost"
            loading={busy === 'apple'}
            disabled={busy !== null && busy !== 'apple'}
            onPress={() => social('apple')}
          />

          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text variant="tiny" tone="tertiary">
              oppure con email
            </Text>
            <View style={styles.rule} />
          </View>

          <Field
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="nome@esempio.it"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Password"
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            error={error}
          />

          <Button
            label={isDemo ? 'Entra (dimostrativo)' : 'Accedi con email'}
            variant="ghost"
            loading={busy === 'email'}
            disabled={busy !== null && busy !== 'email'}
            onPress={() => withEmail('email')}
          />
          <Button
            label="Crea un account con email"
            variant="ghost"
            loading={busy === 'signup'}
            disabled={busy !== null && busy !== 'signup'}
            onPress={() => withEmail('signup')}
          />

          <InstallBanner />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 32 },
  hero: { marginBottom: 28, gap: 10, alignItems: 'center' },
  wordmark: { textAlign: 'center' },
  tagline: { maxWidth: 320, textAlign: 'center' },
  form: { gap: 12 },
  demo: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
    backgroundColor: t.color.accent.subtleBg,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  rule: { flex: 1, height: 1, backgroundColor: t.color.border.subtle },
}));
