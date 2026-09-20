import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

/**
 * Marchio Lobby: anello oro (stesso segno delle icone PWA) e wordmark
 * editoriale, allineato al back-office.
 */
export function Brand({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const mark = compact ? 28 : 64;
  const stroke = compact ? 4.5 : 9;

  return (
    <View
      style={[styles.root, compact && styles.rootCompact]}
      accessibilityRole="image"
      accessibilityLabel="Lobby"
    >
      <Svg width={mark} height={mark} viewBox="0 0 64 64">
        <Circle
          cx="32"
          cy="32"
          r="20"
          fill="none"
          stroke={theme.color.accent.default}
          strokeWidth={stroke}
        />
      </Svg>
      <Text variant={compact ? 'titleSm' : 'titleLg'} tone="accent" style={styles.word}>
        LOBBY
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  root: { alignItems: 'center', gap: 10 },
  rootCompact: { flexDirection: 'row', gap: 10 },
  word: {
    letterSpacing: 5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
}));
