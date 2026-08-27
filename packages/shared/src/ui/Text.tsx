import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import type { ThemeType } from '../tokens/contract';

export type TextVariant = keyof ThemeType;
export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'signal' | 'onAccent';

/**
 * Testo tematizzato.
 *
 * Sostituisce i blocchi `{ ...typography.X, color: colors.Y }` scritti a mano
 * — erano una sessantina, ed è il motivo per cui ogni ritocco tipografico
 * finiva per toccare decine di file. Qui la correzione si applica in un punto.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: TextTone }): React.JSX.Element {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <RNText
      {...rest}
      style={[theme.type[variant], styles[tone], style]}
    />
  );
}

const useStyles = makeStyles((t) => ({
  primary: { color: t.color.text.primary },
  secondary: { color: t.color.text.secondary },
  tertiary: { color: t.color.text.tertiary },
  accent: { color: t.color.accent.default },
  signal: { color: t.color.signal.default },
  onAccent: { color: t.color.text.onAccent },
}));
