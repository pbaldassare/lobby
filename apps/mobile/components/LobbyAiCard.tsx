import { colors, space, typography } from '@lobby/shared/tokens';
import { Button, Card, MatchScore } from '@lobby/shared/ui';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MatchRow } from '@/hooks/useMatches';
import { scoreToPercent } from '@/lib/format';

export function LobbyAiCard({
  topMatches,
  onOpen,
}: {
  topMatches: MatchRow[];
  onOpen: (match: MatchRow) => void;
}): React.JSX.Element {
  const top = topMatches.slice(0, 3);

  return (
    <Card variant="ice">
      <Text style={styles.kicker}>Lobby AI</Text>
      <Text style={styles.title}>Relevant matches in the room</Text>
      {top.length === 0 ? (
        <Text style={styles.body}>
          Become visible to surface offer/seek overlaps. Scoring runs server-side.
        </Text>
      ) : (
        <View style={styles.list}>
          {top.map((m) => (
            <View key={m.id} style={styles.item}>
              <View style={styles.itemText}>
                <Text style={styles.name}>{m.other.display_name ?? 'Member'}</Text>
                <Text style={styles.reason} numberOfLines={2}>
                  {m.reasons[0] ?? 'Offer / seek overlap'}
                </Text>
              </View>
              <MatchScore score={scoreToPercent(m.score)} size="md" />
            </View>
          ))}
        </View>
      )}
      {top[0] ? (
        <Button label="Open top match" onPress={() => onOpen(top[0]!)} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: { ...typography.kicker, color: colors.gold.base, marginBottom: space.xs },
  title: { ...typography.displaySm, color: colors.ink.primary, marginBottom: space.sm },
  body: { ...typography.sm, color: colors.ink.muted },
  list: { gap: space.md, marginBottom: space.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  itemText: { flex: 1, gap: 2 },
  name: { ...typography.labelStrong, color: colors.ink.primary },
  reason: { ...typography.tiny, color: colors.ink.muted },
});
