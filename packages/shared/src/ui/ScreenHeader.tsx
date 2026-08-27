import React from 'react';
import { View } from 'react-native';

import { makeStyles } from '../theme';
import { Text } from './Text';

/**
 * Intestazione di schermata: sopratitolo, titolo, sottotitolo, azione a destra.
 *
 * Lo stesso blocco (`header` / `kicker` / `title` / `sub`) era copiaincollato
 * in sei schermate. Per ora lo usa solo la Room; le altre lo adottano quando
 * vengono ridisegnate.
 */
export function ScreenHeader({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={styles.root}>
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
  root: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1, gap: 4 },
  action: { paddingTop: 2 },
}));
