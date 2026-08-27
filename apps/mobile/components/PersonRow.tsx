import { makeStyles, useTheme } from '@lobby/shared/theme';
import type { RoomPerson } from '@lobby/shared/types';
import { Icon, Text } from '@lobby/shared/ui';
import React from 'react';
import { Image, Pressable, View } from 'react-native';

import { initialsFromProfile, scoreToPercent } from '@/lib/format';

/**
 * Una persona visibile nella stanza.
 *
 * Il motivo del match sale di livello: prima era l'ultima riga di una card
 * densa, sotto badge e chip, ed era la sola informazione che spiega perché
 * dovresti alzarti e andare a parlare con qualcuno.
 *
 * Disegna avatar, sigillo e chip per conto proprio invece di comporre i
 * primitivi condivisi: quelli hanno ancora la palette scura cablata e li
 * usano altre cinque schermate, che in questo giro non devono cambiare
 * aspetto. Migrano quando vengono ridisegnate anche loro.
 */
export function PersonRow({
  person,
  onPress,
}: {
  person: RoomPerson;
  onPress: () => void;
}): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const { profile, match, membership } = person;

  const venueName = membership?.venue?.name;
  const sealed = Boolean(venueName && membership?.seal_issued_at);
  const scorePct = match ? scoreToPercent(Number(match.score)) : null;
  const reason = match?.reasons?.[0];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={profile.display_name ?? 'Membro'}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text variant="score" tone="accent">
          {initialsFromProfile(profile)}
        </Text>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
        ) : null}
      </View>

      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text variant="name" numberOfLines={1} style={styles.name}>
            {profile.display_name ?? 'Membro'}
          </Text>
          {scorePct != null ? (
            <Text variant="score" tone="signal">
              {scorePct}%
            </Text>
          ) : null}
        </View>

        <Text variant="small" tone="secondary" numberOfLines={1}>
          {profile.headline ?? profile.company ?? 'Membro'}
        </Text>

        {sealed ? (
          <View style={styles.seal}>
            <Icon name="check" size={12} color={theme.color.accent.default} strokeWidth={2.4} />
            <Text variant="tiny" tone="accent" numberOfLines={1}>
              {venueName}
            </Text>
          </View>
        ) : null}

        {reason ? (
          <Text variant="tiny" tone="signal" numberOfLines={2} style={styles.reason}>
            {reason}
          </Text>
        ) : null}

        {profile.offer.length > 0 || profile.seek.length > 0 ? (
          <View style={styles.chips}>
            {profile.offer.slice(0, 2).map((tag) => (
              <View key={`o-${tag}`} style={styles.chip}>
                <Text variant="tiny" tone="secondary">
                  {tag}
                </Text>
              </View>
            ))}
            {profile.seek.slice(0, 1).map((tag) => (
              <View key={`s-${tag}`} style={[styles.chip, styles.chipSeek]}>
                <Text variant="tiny" tone="signal">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: t.color.border.subtle,
  },
  pressed: { opacity: 0.6 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.color.accent.subtleBg,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { ...({ position: 'absolute' } as const), width: 44, height: 44 },
  meta: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { flex: 1 },
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 2,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
    backgroundColor: t.color.accent.subtleBg,
  },
  reason: { marginTop: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
    backgroundColor: t.color.bg.raised,
  },
  chipSeek: {
    borderColor: t.color.signal.border,
    backgroundColor: t.color.signal.subtleBg,
  },
}));
