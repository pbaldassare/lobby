import { colors, space, typography } from '@lobby/shared/tokens';
import { Card } from '@lobby/shared/ui';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useProjects } from '@/hooks/useProjects';

/** Selected projects — NOT a social feed. */
export default function ShowcaseScreen(): React.JSX.Element {
  const { projects, loading } = useProjects();
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Showcase</Text>
        <Text style={styles.sub}>
          Hand-picked projects you choose to surface — not an algorithmic feed.
        </Text>
      </View>
      {loading ? <Text style={styles.hint}>Loading…</Text> : null}
      {projects.length === 0 && !loading ? (
        <Text style={styles.hint}>No projects on your card yet.</Text>
      ) : null}
      {projects.map((p) => (
        <Card key={p.id} variant="project" style={styles.card}>
          <Text style={styles.kicker}>Project</Text>
          <Text style={styles.name}>{p.title}</Text>
          <Text style={styles.pitch}>{p.public_pitch}</Text>
          {p.deck_requestable ? (
            <Text style={styles.deck}>Private deck on request · after mutual connection</Text>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.md },
  title: { ...typography.displayLg, color: colors.ink.primary },
  sub: { ...typography.sm, color: colors.ink.muted },
  hint: { ...typography.sm, color: colors.ink.muted2 },
  card: { gap: space.sm },
  kicker: { ...typography.kicker, color: colors.gold.base },
  name: { ...typography.projectName, color: colors.ink.primary },
  pitch: { ...typography.body, color: colors.ink.muted },
  deck: { ...typography.tiny, color: colors.ink.muted2, marginTop: space.xs },
});
