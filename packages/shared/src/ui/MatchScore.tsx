import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';

export type MatchScoreProps = {
  /** Punteggio 0–100 */
  score: number;
  size?: 'sm' | 'md';
  style?: StyleProp<TextStyle>;
};

/**
 * Percentuale match in verde Display (come `.match` nel mockup).
 */
export function MatchScore({
  score,
  size = 'sm',
  style,
}: MatchScoreProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <Text
      accessibilityLabel={`Match score ${clamped} percent`}
      style={[
        styles.base,
        size === 'md' ? styles.md : styles.sm,
        style,
      ]}
    >
      {clamped}%
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.green.base,
    fontFamily: typography.match.fontFamily,
    fontWeight: typography.match.fontWeight,
  },
  sm: {
    fontSize: typography.match.fontSize,
    lineHeight: typography.match.lineHeight,
  },
  md: {
    fontSize: 15,
    lineHeight: 18,
  },
});
