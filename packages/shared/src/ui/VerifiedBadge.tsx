import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { space } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { Seal } from './Seal';

export type VerifiedBadgeProps = {
  venueName: string;
  venueMark?: string;
  venueBg?: string;
  venueFg?: string;
  /** Layout compatto (pill) o card membership più ampia */
  layout?: 'pill' | 'member';
  since?: string | null;
  style?: StyleProp<ViewStyle>;
};

/**
 * Badge "Verified member · {venue}" — il sigillo è rilasciato dal venue.
 */
export function VerifiedBadge({
  venueName,
  venueMark,
  venueBg,
  venueFg,
  layout = 'pill',
  since,
  style,
}: VerifiedBadgeProps): React.JSX.Element {
  const mark = venueMark ?? venueName.slice(0, 2).toUpperCase();

  if (layout === 'member') {
    return (
      <View style={[styles.member, style]}>
        <Seal
          venueMark={mark}
          venueBg={venueBg}
          venueFg={venueFg}
          size={34}
        />
        <View style={styles.memberText}>
          <Text style={styles.memberTitle}>Verified member · {venueName}</Text>
          <Text style={styles.memberSub}>
            Membership confirmed by the venue
            {since ? ` · since ${since}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.pill, style]}>
      <Seal venueMark={mark} venueBg={venueBg} venueFg={venueFg} size={20} />
      <Text style={styles.pillText}>
        Verified member · <Text style={styles.pillStrong}>{venueName}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm - 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.gold,
    backgroundColor: colors.fill.goldWash,
    paddingVertical: 3,
    paddingLeft: 4,
    paddingRight: space.md - 1,
    marginTop: space.sm - 1,
  },
  pillText: {
    ...typography.tiny,
    color: colors.ink.muted,
  },
  pillStrong: {
    color: colors.ink.primary,
    fontWeight: '600',
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.member,
    borderWidth: 1,
    borderColor: colors.border.goldMid,
    backgroundColor: colors.fill.goldWash,
    paddingVertical: space.lg - 1,
    paddingHorizontal: space.lg,
    marginTop: space.xl,
  },
  memberText: {
    flex: 1,
  },
  memberTitle: {
    ...typography.smStrong,
    color: colors.gold.base,
  },
  memberSub: {
    ...typography.tiny,
    color: colors.ink.muted2,
    marginTop: 2,
  },
});
