import { makeStyles } from '@lobby/shared/theme';
import type { ProjectStatus } from '@lobby/shared/types';
import { Button, Field, Segmented, Text } from '@lobby/shared/ui';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProjects } from '@/hooks/useProjects';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'In corso' },
  { value: 'paused', label: 'Pausa' },
  { value: 'shipped', label: 'Lanciato' },
];

export default function EditProjectScreen(): React.JSX.Element {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const rawId = useLocalSearchParams<{ id?: string | string[] }>().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { projects, createProject, updateProject, deleteProject } = useProjects();
  const existing = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [pitch, setPitch] = useState(existing?.public_pitch ?? '');
  const [role, setRole] = useState(existing?.role_title ?? '');
  const [status, setStatus] = useState<ProjectStatus>(existing?.status ?? 'active');
  const [visible, setVisible] = useState(existing?.is_visible ?? true);
  const [deck, setDeck] = useState(existing?.deck_requestable ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setPitch(existing.public_pitch);
    setRole(existing.role_title ?? '');
    setStatus(existing.status);
    setVisible(existing.is_visible);
    setDeck(existing.deck_requestable);
  }, [existing]);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Serve un titolo.');
      return;
    }
    setBusy(true);
    setError(null);
    const draft = {
      title: trimmed,
      public_pitch: pitch.trim(),
      role_title: role.trim() || null,
      status,
      deck_requestable: deck,
      is_visible: visible,
    };
    const op = existing ? updateProject(existing.id, draft) : createProject(draft);
    void op.then(({ error: err }) => {
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      router.back();
    });
  };

  const remove = () => {
    if (!existing) return;
    setBusy(true);
    void deleteProject(existing.id).then(({ error: err }) => {
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
          Il pitch è pubblico in stanza quando sei visibile. Il deck resta
          privato finché non c'è una connessione reciproca.
        </Text>

        <Field label="Titolo" value={title} onChangeText={setTitle} placeholder="Nome del progetto" />
        <Field
          label="Il tuo ruolo"
          value={role}
          onChangeText={setRole}
          placeholder="Founder, advisor, investor…"
        />
        <Field
          label="Pitch"
          value={pitch}
          onChangeText={setPitch}
          placeholder="In due frasi, su cosa stai lavorando"
          multiline
          inputStyle={styles.multiline}
        />

        <View style={styles.block}>
          <Text variant="tiny" tone="secondary">
            Stato
          </Text>
          <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </View>

        <View style={styles.block}>
          <Text variant="tiny" tone="secondary">
            Sulla card
          </Text>
          <Segmented
            options={[
              { value: 'yes', label: 'Visibile' },
              { value: 'no', label: 'Nascosto' },
            ]}
            value={visible ? 'yes' : 'no'}
            onChange={(v) => setVisible(v === 'yes')}
          />
        </View>

        <View style={styles.block}>
          <Text variant="tiny" tone="secondary">
            Deck privato
          </Text>
          <Segmented
            options={[
              { value: 'yes', label: 'Su richiesta' },
              { value: 'no', label: 'No' },
            ]}
            value={deck ? 'yes' : 'no'}
            onChange={(v) => setDeck(v === 'yes')}
          />
        </View>

        {error ? (
          <Text variant="tiny" tone="danger">
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button label={existing ? 'Salva' : 'Aggiungi'} loading={busy} onPress={save} />
          {existing ? (
            <Button label="Elimina" variant="ghost" disabled={busy} onPress={remove} />
          ) : null}
          <Button label="Annulla" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  scroll: { padding: 18, gap: 14 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  block: { gap: 6 },
  actions: { gap: 8, marginTop: 6 },
}));
