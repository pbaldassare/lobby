import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

export type ButtonVariant = 'gold' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Azione primaria (`gold`, cioè in tinta accento) e secondaria (`ghost`).
 *
 * Il nome della variante è rimasto quello storico per non toccare una
 * quarantina di punti d'uso, ma il colore ora arriva dal ruolo `accent`:
 * in tema chiaro non è oro.
 */
export function Button({
  label,
  variant = 'gold',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const isDisabled = Boolean(disabled || loading);
  const isAccent = variant === 'gold';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isAccent ? styles.accent : styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            color={isAccent ? theme.color.accent.on : theme.color.text.primary}
          />
        ) : (
          <Text variant="bodyStrong" tone={isAccent ? 'onAccent' : 'primary'}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  base: { width: '100%', borderRadius: t.radius.md, overflow: 'hidden', borderWidth: 1 },
  accent: { backgroundColor: t.color.accent.default, borderColor: t.color.accent.default },
  ghost: { backgroundColor: t.color.bg.raised, borderColor: t.color.border.strong },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  /** Solo opacità: uno `scale` sposta i limiti del layout e fa vibrare
   *  ciò che sta intorno. */
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
}));
