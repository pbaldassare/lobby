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

import { isEnvConfigured } from '@/lib/env';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Ingresso.
 *
 * Prima erano quattro bottoni a tutta larghezza di peso identico — email,
 * registrazione, Google, LinkedIn — senza nessuna gerarchia: guardandoli non
 * capivi qual era la strada principale. Ora l'accesso email è l'azione
 * primaria, gli altri stanno sotto un separatore.
 *
 * Il `KeyboardAvoidingView` sta FUORI dallo scorrimento, non dentro: annidato
 * al contrario si comportava male su Android.
 */
export default function WelcomeScreen(): React.JSX.Element {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = (fn: () => Promise<{ error: string | null }>) => {
    setBusy(true);
    setError(null);
    void fn().then(({ error: err }) => {
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      // Dopo il login si è invisibili: se ne occupa PresenceProvider.
      router.replace('/(app)/(tabs)/discover');
    });
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
            Accedi a Lobby
          </Text>
          <Text variant="body" tone="secondary" style={styles.tagline}>
            Appari solo quando lo decidi tu. Incontra chi vale la pena incontrare.
          </Text>
        </View>

        <View style={styles.form}>
          <Text variant="small" tone="secondary">
            Resti invisibile anche dopo l'accesso. La visibilità si attiva a mano,
            vale solo nella stanza in cui sei e si spegne quando esci.
          </Text>

          {!isEnvConfigured() ? (
            <View style={styles.demo}>
              <Text variant="tiny" tone="accent">
                Modalità dimostrativa · dati finti, nessun database collegato
              </Text>
            </View>
          ) : null}

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
            label={isDemo ? 'Entra (dimostrativo)' : 'Accedi'}
            loading={busy}
            onPress={() =>
              run(() => signInWithEmail(email || 'demo@lobby.app', password || 'demo'))
            }
          />
          <Button
            label="Crea un account"
            variant="ghost"
            onPress={() =>
              run(() => signUpWithEmail(email || 'demo@lobby.app', password || 'demo'))
            }
          />

          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text variant="tiny" tone="tertiary">
              oppure
            </Text>
            <View style={styles.rule} />
          </View>

          <Button
            label="Continua con Google"
            variant="ghost"
            onPress={() => run(() => signInWithOAuth('google'))}
          />
          <Button
            label="Continua con LinkedIn"
            variant="ghost"
            onPress={() => run(() => signInWithOAuth('linkedin_oidc'))}
          />
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
