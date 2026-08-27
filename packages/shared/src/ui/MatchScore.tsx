import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { Text } from './Text';

export type MatchScoreProps = {
  /** Punteggio 0–100. */
  score: number;
  size?: 'sm' | 'md';
  style?: StyleProp<TextStyle>;
};

/**
 * Percentuale di affinità, in tinta `signal`.
 *
 * Il verde qui è semantico: dice "questa persona ti riguarda". Non si usa
 * come colore decorativo altrove.
 */
export function MatchScore({ score, size = 'sm', style }: MatchScoreProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <Text
      accessibilityLabel={`Affinità ${clamped} per cento`}
      variant={size === 'md' ? 'name' : 'score'}
      tone="signal"
      style={style}
    >
      {clamped}%
    </Text>
  );
}
