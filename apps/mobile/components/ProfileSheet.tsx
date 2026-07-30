import type { RoomPerson } from '@lobby/shared/types';
import { colors, space, typography } from '@lobby/shared/tokens';
import {
  Avatar,
  BottomSheet,
  Button,
  Chip,
  MatchScore,
  VerifiedBadge,
} from '@lobby/shared/ui';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useBlocks } from '@/hooks/useBlocks';
import { useSignals } from '@/hooks/useSignals';
import { initialsFromProfile, scoreToPercent, suggestedOpener } from '@/lib/format';

export function ProfileSheet({
  person,
  visible,
  onClose,
}: {
  person: RoomPerson | null;
  visible: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const { sendSignal } = useSignals();
  const { blockProfile, blockCompany } = useBlocks();
  const [busy, setBusy] = useState(false);

  const opener = useMemo(() => {
    if (!person) return '';
    return suggestedOpener(person.match?.reasons ?? [], person.profile.seek);
  }, [person]);

  if (!person) {
    return (
      <BottomSheet visible={false} onClose={onClose}>
        <View />
      </BottomSheet>
    );
  }

  const { profile, match, membership } = person;
  const venueName = membership?.venue?.name;
  const scorePct = match ? scoreToPercent(Number(match.score)) : null;
  const sealed = Boolean(membership?.seal_issued_at);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Avatar
          initials={initialsFromProfile(profile)}
          uri={profile.avatar_url}
          size={64}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile.display_name ?? 'Member'}</Text>
          <Text style={styles.headline}>
            {profile.headline ?? profile.company ?? 'Member'}
          </Text>
          {scorePct != null ? (
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Match</Text>
              <MatchScore score={scorePct} size="md" />
            </View>
          ) : null}
        </View>
      </View>

      {sealed && venueName ? (
        <VerifiedBadge
          venueName={venueName}
          layout="member"
          since={membership?.since ?? null}
        />
      ) : (
        <Text style={styles.note}>
          Membership seal is issued by the venue — never self-claimed.
        </Text>
      )}

      {profile.spotlight ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Building now</Text>
          <Text style={styles.sectionBody}>{profile.spotlight}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offers</Text>
        <View style={styles.chips}>
          {profile.offer.map((t) => (
            <Chip key={t} label={t} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seeking</Text>
        <View style={styles.chips}>
          {profile.seek.map((t) => (
            <Chip key={t} label={t} variant="match" />
          ))}
        </View>
      </View>

      {match?.reasons?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why matched</Text>
          {match.reasons.map((r) => (
            <Text key={r} style={styles.sectionBody}>
              · {r}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested opener</Text>
        <Text style={styles.sectionBody}>{opener}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Send signal"
          loading={busy}
          onPress={() => {
            setBusy(true);
            void sendSignal(profile.id, opener).then(({ error }) => {
              setBusy(false);
              if (error) Alert.alert('Signal failed', error);
              else {
                Alert.alert(
                  'Signal sent',
                  'Chat unlocks only after they accept (mutual consent).',
                );
                onClose();
              }
            });
          }}
        />
        <Button
          label="Hide from this person"
          variant="ghost"
          onPress={() => {
            void blockProfile(profile.id).then(onClose);
          }}
        />
        {profile.company ? (
          <Button
            label={`Hide company · ${profile.company}`}
            variant="ghost"
            onPress={() => {
              void blockCompany(profile.company!).then(onClose);
            }}
          />
        ) : null}
        <Text style={styles.privacy}>
          Warm intros require a connected mutual — server intro flow. Chat only
          after reciprocal connection.
        </Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: space.lg, marginBottom: space.lg },
  headerText: { flex: 1, gap: space.xs, justifyContent: 'center' },
  name: { ...typography.displayMd, color: colors.ink.primary },
  headline: { ...typography.sm, color: colors.ink.muted },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  scoreLabel: { ...typography.tiny, color: colors.ink.muted2 },
  note: { ...typography.sm, color: colors.ink.muted, marginBottom: space.lg },
  section: { marginTop: space.lg, gap: space.sm },
  sectionTitle: { ...typography.kicker, color: colors.gold.base },
  sectionBody: { ...typography.body, color: colors.ink.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.chipGap },
  actions: { marginTop: space['2xl'], gap: space.sm },
  privacy: { ...typography.tiny, color: colors.ink.muted2, marginTop: space.sm },
});
