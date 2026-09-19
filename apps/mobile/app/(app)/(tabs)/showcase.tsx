import { makeStyles } from '@lobby/shared/theme';
import type { Project } from '@lobby/shared/types';
import { Button, Card, Chip, ListEmpty, ScreenHeader, Text } from '@lobby/shared/ui';
import { type Href, router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useProjects } from '@/hooks/useProjects';

const STATUS_LABEL: Record<Project['status'], string> = {
  active: 'In corso',
  paused: 'In pausa',
  shipped: 'Lanciato',
};

/** Progetti scelti a mano — non è un feed. */
export default function ShowcaseScreen(): React.JSX.Element {
  const styles = useStyles();
  const { projects, loading } = useProjects();

  return (
    <Screen>
      <ScreenHeader
        icon="showcase"
        title="Progetti"
        subtitle="Quello che scegli di mostrare. Nessun algoritmo decide per te."
      />

      <Button
        label="Aggiungi un progetto"
        onPress={() => router.push('/(app)/edit-project' as Href)}
      />

      {loading ? <ListEmpty loading title="Carico i progetti" /> : null}

      {!loading && projects.length === 0 ? (
        <ListEmpty
          icon="showcase"
          title="Nessun progetto sulla tua card"
          body="Aggiungine uno per far capire su cosa stai lavorando."
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
              onPress={() =>
                router.push(`/(app)/edit-project?id=${p.id}` as Href)
              }
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
          {p.deck_requestable ? (
            <View style={styles.deck}>
              <Text variant="tiny" tone="tertiary">
                Deck privato su richiesta · dopo connessione reciproca
              </Text>
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 6 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  deck: { marginTop: 4 },
}));
