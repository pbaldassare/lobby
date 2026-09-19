import { makeStyles } from '@lobby/shared/theme';
import { Button, Card, Field, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProjects, type ProjectDraft } from '@/hooks/useProjects';
import {
  parseLinkedInProjects,
  type LinkedInProjectDraft,
} from '@/lib/parseLinkedInProjects';

type Row = LinkedInProjectDraft & { key: string };

function toRows(drafts: LinkedInProjectDraft[]): Row[] {
  return drafts.map((d, i) => ({ ...d, key: `${d.title}-${i}-${d.public_pitch.length}` }));
}

function emptyRow(): Row {
  return { key: `new-${Date.now()}`, title: '', role_title: null, public_pitch: '' };
}

/**
 * Copia guidata da LinkedIn → progetti Lobby.
 * Non è una query live: incolli il testo, restano nel nostro DB.
 */
export default function ImportProjectsScreen(): React.JSX.Element {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { createProjects } = useProjects();
  const [paste, setPaste] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const prepare = () => {
    setError(null);
    const parsed = parseLinkedInProjects(paste);
    if (parsed.length === 0) {
      setError('Non ho trovato progetti nel testo. Incolla Esperienza o Progetti da LinkedIn, oppure aggiungi una riga.');
      setRows((prev) => (prev.length > 0 ? prev : [emptyRow()]));
      return;
    }
    setRows(toRows(parsed));
  };

  const updateRow = (key: string, patch: Partial<LinkedInProjectDraft>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const save = () => {
    const drafts: ProjectDraft[] = rows
      .filter((r) => r.title.trim())
      .map((r) => ({
        title: r.title,
        public_pitch: r.public_pitch,
        role_title: r.role_title,
        status: 'active',
        deck_requestable: true,
        is_visible: true,
      }));
    if (drafts.length === 0) {
      setError('Aggiungi almeno un titolo.');
      return;
    }
    setBusy(true);
    setError(null);
    void createProjects(drafts).then(({ error: err }) => {
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
          LinkedIn non ci manda i progetti. Incolla qui Esperienza o Progetti
          dal tuo profilo: la copia vive in Lobby, non dipende più da LinkedIn.
        </Text>

        <Field
          label="Incolla da LinkedIn"
          value={paste}
          onChangeText={setPaste}
          placeholder={'Product Lead at Hearth\nMarketplace for industrial waste heat.\n\nHearth Exchange\nMatching factories with district heating.'}
          multiline
          inputStyle={styles.paste}
        />

        <Button label="Prepara la copia" variant="ghost" onPress={prepare} />

        {rows.length > 0 ? (
          <Text variant="tiny" tone="tertiary">
            Controlla e correggi prima di salvare. Puoi togliere o aggiungere righe.
          </Text>
        ) : null}

        {rows.map((row) => (
          <Card key={row.key} style={styles.row}>
            <Field
              label="Titolo"
              value={row.title}
              onChangeText={(title) => updateRow(row.key, { title })}
              placeholder="Nome del progetto o azienda"
            />
            <Field
              label="Ruolo"
              value={row.role_title ?? ''}
              onChangeText={(role) => updateRow(row.key, { role_title: role || null })}
              placeholder="Founder, GP…"
            />
            <Field
              label="Pitch"
              value={row.public_pitch}
              onChangeText={(public_pitch) => updateRow(row.key, { public_pitch })}
              placeholder="In due frasi"
              multiline
              inputStyle={styles.pitch}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
            >
              <Text variant="tiny" tone="danger">
                Rimuovi
              </Text>
            </Pressable>
          </Card>
        ))}

        <Button label="Aggiungi una riga" variant="ghost" onPress={() => setRows((prev) => [...prev, emptyRow()])} />

        {error ? (
          <Text variant="tiny" tone="danger">
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button label="Salva in Lobby" loading={busy} onPress={save} />
          <Button label="Annulla" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  scroll: { padding: 18, gap: 14 },
  paste: { minHeight: 140, textAlignVertical: 'top' },
  pitch: { minHeight: 72, textAlignVertical: 'top' },
  row: { gap: 10 },
  actions: { gap: 8, marginTop: 6 },
}));
