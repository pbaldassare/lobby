import { makeStyles } from '@lobby/shared/theme';
import type { Project } from '@lobby/shared/types';
import { Button, Card, Chip, ListEmpty, Text } from '@lobby/shared/ui';
import { type Href, router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { useProjects } from '@/hooks/useProjects';

const STATUS_LABEL: Record<Project['status'], string> = {
  active: 'In corso',
  paused: 'In pausa',
  shipped: 'Lanciato',
};

/** Progetti sulla card: scelti a mano, non un feed. */
export function ProfileProjects(): React.JSX.Element {
  const styles = useStyles();
  const { projects, loading, canUpload, createProjectFromFile } = useProjects();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFromHere = () => {
    setBusy(true);
    setError(null);
    void createProjectFromFile().then(({ error: err, id }) => {
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      if (id) router.push(`/(app)/edit-project?id=${id}` as Href);
    });
  };

  return (
    <View style={styles.stack}>
      <Text variant="titleSm">Progetti</Text>
      <Text variant="small" tone="secondary">
        Quello che scegli di mostrare. Nessun algoritmo decide per te.
      </Text>

      <Button
        label="Carica file"
        loading={busy}
        disabled={!canUpload}
        onPress={uploadFromHere}
      />
      <Button
        label="Aggiungi a mano"
        variant="ghost"
        onPress={() => router.push('/(app)/edit-project' as Href)}
      />
      <Button
        label="Copia da LinkedIn"
        variant="ghost"
        onPress={() => router.push('/(app)/import-projects' as Href)}
      />
      {error ? (
        <Text variant="tiny" tone="danger">
          {error}
        </Text>
      ) : null}

      {loading ? <ListEmpty loading title="Carico i progetti" /> : null}

      {!loading && projects.length === 0 ? (
        <ListEmpty
          icon="showcase"
          title="Nessun progetto sulla tua card"
          body="Carica un PDF, aggiungilo a mano o copia Esperienza/Progetti da LinkedIn. Restano in Lobby."
        />
      ) : null}

      {projects.map((p) => (
        <Card key={p.id} variant="project" style={styles.card}>
          <View style={styles.head}>
            <Text variant="kicker" tone="accent">
              {p.role_title ? p.role_title : 'Progetto'}
            </Text>
            <Chip
              label="Modifica"
              onPress={() => router.push(`/(app)/edit-project?id=${p.id}` as Href)}
            />
          </View>
          <Text variant="titleSm">{p.title}</Text>
          <Text variant="body" tone="secondary">
            {p.public_pitch}
          </Text>
          <View style={styles.meta}>
            <Chip label={STATUS_LABEL[p.status]} />
            {!p.is_visible ? <Chip label="Nascosto" /> : null}
          </View>
          <Text variant="tiny" tone="tertiary">
            {p.private_deck_file_name
              ? `File: ${p.private_deck_file_name} · privato fino a connessione reciproca`
              : p.deck_requestable
                ? 'Nessun file ancora · deck su richiesta dopo connessione reciproca'
                : 'Nessun file caricato'}
          </Text>
        </Card>
      ))}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  stack: { gap: 12 },
  card: { gap: 6 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
}));
