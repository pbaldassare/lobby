import { makeStyles } from '@lobby/shared/theme';
import { Card, ListEmpty, ScreenHeader, Text } from '@lobby/shared/ui';
import React from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useProjects } from '@/hooks/useProjects';

/** Progetti scelti a mano — non è un feed. */
export default function ShowcaseScreen(): React.JSX.Element {
  const styles = useStyles();
  const { projects, loading } = useProjects();

  return (
    <Screen>
      <ScreenHeader
        title="Progetti"
        subtitle="Quello che scegli di mostrare. Nessun algoritmo decide per te."
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
          <Text variant="kicker" tone="accent">
            Progetto
          </Text>
          <Text variant="titleSm">{p.title}</Text>
          <Text variant="body" tone="secondary">
            {p.public_pitch}
          </Text>
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
  deck: { marginTop: 4 },
}));
