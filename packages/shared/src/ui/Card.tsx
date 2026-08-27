import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles } from '../theme';

export type CardVariant = 'glass' | 'solid' | 'ice' | 'biz' | 'project' | 'projectCool';

export type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Superficie sollevata.
 *
 * I nomi delle varianti sono quelli storici — cambiarli avrebbe toccato una
 * dozzina di schermate senza guadagno — ma i valori arrivano dai ruoli.
 * `projectCool` non è mai stata istanziata e ora coincide con `project`:
 * si toglie quando si ripuliscono i punti d'uso.
 */
export function Card({
  children,
  variant = 'glass',
  padded = true,
  onPress,
  style,
}: CardProps): React.JSX.Element {
  const styles = useStyles();
  const surface = [styles.base, styles[variant], padded && styles.padded, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [...surface, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={surface}>{children}</View>;
}

export function Glass(props: Omit<CardProps, 'variant'>): React.JSX.Element {
  return <Card {...props} variant="glass" />;
}

const useStyles = makeStyles((t) => ({
  base: { borderWidth: 1, borderRadius: t.radius.lg, overflow: 'hidden' },
  padded: { padding: 15 },
  pressed: { opacity: 0.82 },

  glass: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.border.subtle,
    borderRadius: t.radius.lg,
  },
  solid: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.border.subtle,
    borderRadius: t.radius.md,
  },
  ice: {
    backgroundColor: t.color.accent.subtleBg,
    borderColor: t.color.accent.subtleBorder,
    borderRadius: t.radius.md,
  },
  biz: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.border.strong,
    borderRadius: t.radius.lg,
  },
  project: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.accent.subtleBorder,
    borderRadius: t.radius.md,
  },
  projectCool: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.accent.subtleBorder,
    borderRadius: t.radius.md,
  },
}));
