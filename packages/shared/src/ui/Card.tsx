import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { space } from '../tokens/spacing';

export type CardVariant = 'glass' | 'solid' | 'ice' | 'biz' | 'project' | 'projectCool';

export type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  padded?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Superficie card / glass del mockup.
 * Preferisci questa per contenitori di interazione (lista persone, pitch, …).
 */
export function Card({
  children,
  variant = 'glass',
  padded = true,
  onPress,
  style,
}: CardProps): React.JSX.Element {
  const surface = [styles.base, variantStyles[variant], padded && styles.padded, style];

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

/** Alias esplicito per il trattamento glass del mockup */
export function Glass(props: Omit<CardProps, 'variant'>): React.JSX.Element {
  return <Card {...props} variant="glass" />;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.glass,
    overflow: 'hidden',
  },
  padded: {
    padding: space.lg + 1,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.96,
  },
});

const variantStyles = StyleSheet.create({
  glass: {
    backgroundColor: colors.surface.panel,
    borderColor: colors.border.subtle,
    borderRadius: radius.glass,
  },
  solid: {
    backgroundColor: colors.bg.panelSolid,
    borderColor: colors.border.subtle,
    borderRadius: radius.card,
  },
  ice: {
    backgroundColor: colors.fill.goldIce,
    borderColor: colors.border.goldSoft,
    borderRadius: radius.ice,
  },
  biz: {
    backgroundColor: colors.bg.panelMid,
    borderColor: colors.border.strong,
    borderRadius: radius.bizcard,
  },
  project: {
    backgroundColor: colors.bg.panelSolid,
    borderColor: colors.border.goldMid,
    borderRadius: radius.card,
  },
  projectCool: {
    backgroundColor: colors.bg.elevated,
    borderColor: colors.accent.coolBorder,
    borderRadius: radius.card,
  },
});
