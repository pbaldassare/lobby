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
  base: {
    borderWidth: 1,
    borderRadius: 22,
    ...(t.scheme === 'light'
      ? {
          shadowColor: '#1A1917',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }
      : {}),
  },
  padded: { padding: 16 },
  pressed: { opacity: 0.82 },

  glass: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.border.subtle,
  },
  solid: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.border.subtle,
  },
  ice: {
    backgroundColor: t.color.accent.subtleBg,
    borderColor: t.color.accent.subtleBorder,
  },
  biz: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.border.subtle,
  },
  project: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.accent.subtleBorder,
  },
  projectCool: {
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.accent.subtleBorder,
  },
}));
