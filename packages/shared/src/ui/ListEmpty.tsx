import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { GlyphMark } from './GlyphMark';
import { type IconName } from './Icon';
import { Text } from './Text';

/**
 * Stato vuoto o di caricamento di una lista.
 *
 * `EmptyState` esisteva già in `apps/mobile/components/` e nessuna schermata
 * lo usava: le liste inlineavano un `<Text>` segnaposto — nove volte — e
 * sette stringhe `'Loading…'` letterali.
 */
export function ListEmpty({
  icon,
  title,
  body,
  loading = false,
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  loading?: boolean;
  action?: React.ReactNode;
}): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator color={theme.color.accent.default} />
      ) : icon ? (
        <GlyphMark name={icon} size={56} />
      ) : null}
      <Text variant="bodyStrong" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text variant="small" tone="tertiary" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  root: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 20 },
  center: { textAlign: 'center' },
}));
