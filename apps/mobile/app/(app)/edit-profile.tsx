import { makeStyles } from '@lobby/shared/theme';
import { Button, Field, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/AuthProvider';

const toList = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Modifica del profilo.
 *
 * Era un form che compariva dentro la card scambiando il contenuto della
 * stessa schermata: entravi in modifica e perdevi il contesto di cosa stavi
 * modificando. Ora è una rotta con salva ed esci espliciti.
 */
export default function EditProfileScreen(): React.JSX.Element {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAuth();

  const [spotlight, setSpotlight] = useState(profile?.spotlight ?? '');
  const [offer, setOffer] = useState((profile?.offer ?? []).join(', '));
  const [seek, setSeek] = useState((profile?.seek ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = () => {
    setBusy(true);
    setError(null);
    void updateProfile({
      spotlight: spotlight.trim() || null,
      offer: toList(offer),
      seek: toList(seek),
    }).then(({ error: err }) => {
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      router.back();
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.root, { paddingBottom: insets.bottom }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="small" tone="secondary">
          Cosa offri e cosa cerchi sono i due campi su cui viene calcolata
          l'affinità. Tenerli aggiornati cambia chi ti compare davanti.
        </Text>

        <Field
          label="In evidenza"
          value={spotlight}
          onChangeText={setSpotlight}
          placeholder="Su cosa stai lavorando adesso"
          multiline
          inputStyle={styles.multiline}
        />

        <Field
          label="Offro"
          value={offer}
          onChangeText={setOffer}
          placeholder="presentazioni a operatori, consulenza di prodotto"
          hint="Separa con la virgola"
          autoCapitalize="none"
        />

        <Field
          label="Cerco"
          value={seek}
          onChangeText={setSeek}
          placeholder="partner energetici, contatti serie A"
          hint="Separa con la virgola"
          autoCapitalize="none"
          error={error}
        />

        <View style={styles.actions}>
          <Button label="Salva" loading={busy} onPress={save} />
          <Button label="Annulla" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  scroll: { padding: 18, gap: 14 },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  actions: { gap: 8, marginTop: 6 },
}));
