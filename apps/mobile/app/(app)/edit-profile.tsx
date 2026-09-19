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

function normalizeLinkedIn(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/linkedin\.com\//i.test(trimmed)) return `https://${trimmed.replace(/^\/+/, '')}`;
  return trimmed;
}

/**
 * Modifica del profilo Lobby.
 * LinkedIn può riempire i campi vuoti una volta: poi l'identità vive qui.
 */
export default function EditProfileScreen(): React.JSX.Element {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const {
    profile,
    updateProfile,
    hasLinkedIn,
    linkLinkedIn,
    importLinkedInIdentity,
  } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [headline, setHeadline] = useState(profile?.headline ?? '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? '');
  const [hobbies, setHobbies] = useState((profile?.hobbies ?? []).join(', '));
  const [spotlight, setSpotlight] = useState(profile?.spotlight ?? '');
  const [offer, setOffer] = useState((profile?.offer ?? []).join(', '));
  const [seek, setSeek] = useState((profile?.seek ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [liBusy, setLiBusy] = useState(false);

  const save = () => {
    setBusy(true);
    setError(null);
    void updateProfile({
      display_name: displayName.trim() || null,
      headline: headline.trim() || null,
      occupation: occupation.trim() || null,
      company: company.trim() || null,
      linkedin_url: normalizeLinkedIn(linkedinUrl),
      hobbies: toList(hobbies),
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

  const onLinkedIn = () => {
    setLiBusy(true);
    setError(null);
    const run = hasLinkedIn ? importLinkedInIdentity : linkLinkedIn;
    void run().then((result) => {
      setLiBusy(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if ('profile' in result && result.profile) {
        const next = result.profile;
        setDisplayName((prev) => prev || next.display_name || '');
        setHeadline((prev) => prev || next.headline || '');
      }
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
          Questa è l'identità che gli altri vedono quando sei visibile nella
          stanza. LinkedIn può copiare nome e foto nei campi vuoti: dopo, resta
          in Lobby.
        </Text>

        <Button
          label={hasLinkedIn ? 'Usa i dati LinkedIn (campi vuoti)' : 'Collega LinkedIn'}
          variant="ghost"
          loading={liBusy}
          onPress={onLinkedIn}
        />

        <Field
          label="Nome"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Come ti chiami in stanza"
        />
        <Field
          label="Headline"
          value={headline}
          onChangeText={setHeadline}
          placeholder="Product · climate tech"
        />
        <Field
          label="Occupazione"
          value={occupation}
          onChangeText={setOccupation}
          placeholder="Founder, GP, counsel…"
        />
        <Field
          label="Azienda"
          value={company}
          onChangeText={setCompany}
          placeholder="Nome dell'azienda"
        />
        <Field
          label="URL LinkedIn"
          value={linkedinUrl}
          onChangeText={setLinkedinUrl}
          placeholder="https://www.linkedin.com/in/…"
          autoCapitalize="none"
          autoCorrect={false}
          hint="Opzionale. Lo mostri sulla card, non è una scheda live."
        />
        <Field
          label="Hobby"
          value={hobbies}
          onChangeText={setHobbies}
          placeholder="alpinismo, vinile, cucina"
          hint="Separa con la virgola"
        />

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
          hint="Separa con la virgola. Su questi campi si calcola l'affinità."
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
