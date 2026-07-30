import type { RoomPerson } from '@lobby/shared/types';
import { colors, space, typography } from '@lobby/shared/tokens';
import { Avatar, Button, Card, Chip, MatchScore } from '@lobby/shared/ui';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProfileSheet } from '@/components/ProfileSheet';
import { Screen } from '@/components/Screen';
import { useMatches, type MatchRow } from '@/hooks/useMatches';
import { DEMO_ROOM_ID } from '@/lib/demo';
import { initialsFromProfile, scoreToPercent } from '@/lib/format';

export default function MatchesScreen(): React.JSX.Element {
  const { matches, loading, requestRecompute } = useMatches();
  const [selected, setSelected] = useState<RoomPerson | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (m: MatchRow) => {
    setSelected({
      profile: m.other,
      presence: {
        id: 'match',
        profile_id: m.other.id,
        room_id: m.room_id ?? DEMO_ROOM_ID,
        is_visible: true,
        visible_until: null,
        last_heartbeat: new Date().toISOString(),
        entered_at: new Date().toISOString(),
      },
      match: { id: m.id, score: m.score, reasons: m.reasons },
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.sub}>
          Curated on offer, seek, and projects — with reasons. Not a public directory.
        </Text>
      </View>
      <Button
        label="Refresh Lobby AI"
        variant="ghost"
        loading={busy}
        onPress={() => {
          setBusy(true);
          void requestRecompute().finally(() => setBusy(false));
        }}
      />
      {loading ? <Text style={styles.hint}>Loading…</Text> : null}
      {matches.length === 0 && !loading ? (
        <Text style={styles.hint}>
          No matches yet. Be visible in a room and keep offer/seek current.
        </Text>
      ) : null}
      {matches.map((m) => (
        <Card key={m.id} onPress={() => open(m)} style={styles.card}>
          <View style={styles.row}>
            <Avatar initials={initialsFromProfile(m.other)} uri={m.other.avatar_url} />
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{m.other.display_name ?? 'Member'}</Text>
                <MatchScore score={scoreToPercent(m.score)} />
              </View>
              {m.other.headline ? <Text style={styles.headline}>{m.other.headline}</Text> : null}
              {m.reasons.slice(0, 2).map((r) => (
                <Text key={r} style={styles.reason}>
                  · {r}
                </Text>
              ))}
              <View style={styles.chips}>
                {m.other.offer.slice(0, 2).map((t) => (
                  <Chip key={t} label={t} />
                ))}
                {m.other.seek.slice(0, 2).map((t) => (
                  <Chip key={`s-${t}`} label={t} variant="match" />
                ))}
              </View>
            </View>
          </View>
        </Card>
      ))}
      <ProfileSheet
        person={selected}
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.md },
  title: { ...typography.displayLg, color: colors.ink.primary },
  sub: { ...typography.sm, color: colors.ink.muted },
  hint: { ...typography.sm, color: colors.ink.muted2 },
  card: { padding: space.personPad },
  row: { flexDirection: 'row', gap: space.personGap },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.displayXs, color: colors.ink.primary, flex: 1 },
  headline: { ...typography.sm, color: colors.ink.muted },
  reason: { ...typography.tiny, color: colors.green.base },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.chipGap, marginTop: space.xs },
});
