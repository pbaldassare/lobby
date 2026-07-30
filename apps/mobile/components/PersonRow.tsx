import type { RoomPerson } from '@lobby/shared/types';
import { colors, space, typography } from '@lobby/shared/tokens';
import { Avatar, Card, Chip, MatchScore, VerifiedBadge } from '@lobby/shared/ui';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { initialsFromProfile, scoreToPercent } from '@/lib/format';

export function PersonRow({
  person,
  onPress,
}: {
  person: RoomPerson;
  onPress: () => void;
}): React.JSX.Element {
  const { profile, match, membership } = person;
  const venueName = membership?.venue?.name;
  const scorePct = match ? scoreToPercent(Number(match.score)) : null;

  return (
    <Card onPress={onPress} variant="glass" style={styles.card}>
      <View style={styles.row}>
        <Avatar
          initials={initialsFromProfile(profile)}
          uri={profile.avatar_url}
          size={50}
        />
        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.display_name ?? 'Member'}
            </Text>
            {scorePct != null ? <MatchScore score={scorePct} /> : null}
          </View>
          <Text style={styles.headline} numberOfLines={1}>
            {profile.headline ?? profile.company ?? 'Member'}
          </Text>
          {venueName && membership?.seal_issued_at ? (
            <VerifiedBadge venueName={venueName} layout="pill" />
          ) : null}
          {match?.reasons?.[0] ? (
            <Text style={styles.why} numberOfLines={2}>
              Why: {match.reasons[0]}
            </Text>
          ) : null}
          <View style={styles.chips}>
            {profile.offer.slice(0, 2).map((tag) => (
              <Chip key={`o-${tag}`} label={tag} />
            ))}
            {profile.seek.slice(0, 1).map((tag) => (
              <Chip key={`s-${tag}`} label={tag} variant="match" />
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.personGap },
  meta: { flex: 1, gap: space.xs },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  name: { ...typography.displayXs, color: colors.ink.primary, flex: 1 },
  headline: { ...typography.sm, color: colors.ink.muted },
  why: { ...typography.tiny, color: colors.green.base, marginTop: space.xxs },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.chipGap,
    marginTop: space.xs,
  },
});
