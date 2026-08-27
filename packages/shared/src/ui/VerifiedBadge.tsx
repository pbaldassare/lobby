import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles } from '../theme';
import { Seal } from './Seal';
import { Text } from './Text';

export type VerifiedBadgeProps = {
  venueName: string;
  venueMark?: string;
  venueBg?: string;
  venueFg?: string;
  /** Pastiglia compatta o blocco membership. */
  layout?: 'pill' | 'member';
  since?: string | null;
  style?: StyleProp<ViewStyle>;
};

/**
 * "Socio verificato · {venue}".
 *
 * Il margine superiore non è più cotto dentro il componente: la spaziatura
 * la decide chi lo usa, non il badge.
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
  const styles = useStyles();
  const mark = venueMark ?? venueName.slice(0, 2).toUpperCase();

  if (layout === 'member') {
    return (
      <View style={[styles.member, style]}>
        <Seal venueMark={mark} venueBg={venueBg} venueFg={venueFg} size={34} />
        <View style={styles.memberText}>
          <Text variant="bodyStrong" tone="accent">
            Socio verificato · {venueName}
          </Text>
          <Text variant="tiny" tone="tertiary">
            Confermato dal venue
            {since ? ` · dal ${since}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.pill, style]}>
      <Seal venueMark={mark} venueBg={venueBg} venueFg={venueFg} size={18} />
      <Text variant="tiny" tone="accent" numberOfLines={1}>
        {venueName}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
    backgroundColor: t.color.accent.subtleBg,
    paddingVertical: 3,
    paddingLeft: 4,
    paddingRight: 10,
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
    backgroundColor: t.color.accent.subtleBg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  memberText: { flex: 1, gap: 2 },
}));
