import React from 'react';
import { View } from 'react-native';

import { makeStyles } from '../theme';
import { GlyphMark } from './GlyphMark';
import { type IconName } from './Icon';
import { Text } from './Text';

/**
 * Intestazione di schermata: icona in cerchio, titolo, sottotitolo, azione.
 */
export function ScreenHeader({
  icon,
  kicker,
  title,
  subtitle,
  action,
}: {
  icon?: IconName;
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={styles.root}>
      {icon ? <GlyphMark name={icon} size={42} /> : null}
      <View style={styles.copy}>
        {kicker ? (
          <Text variant="kicker" tone="accent" numberOfLines={1}>
            {kicker}
          </Text>
        ) : null}
        <Text variant="titleLg">{title}</Text>
        {subtitle ? (
          <Text variant="small" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  root: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4, minWidth: 0 },
  action: { paddingTop: 2 },
}));
