import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { space } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export type ButtonVariant = 'gold' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * CTA primario gold e ghost bordato (mockup `.btn.gold` / `.btn.ghost`).
 * Il gold usa il mid-tone CTA; in Expo puoi avvolgere con `expo-linear-gradient`
 * (`#F4D58D → #D2A856`) se vuoi il gradiente pixel-perfect.
 */
export function Button({
  label,
  variant = 'gold',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps): React.JSX.Element {
  const isDisabled = Boolean(disabled || loading);
  const isGold = variant === 'gold';
  const labelColor = isGold ? colors.gold.onGold : colors.ink.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isGold ? styles.gold : styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={labelColor} />
        ) : (
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: radius.btn,
    overflow: 'hidden',
  },
  gold: {
    backgroundColor: colors.gold.mid,
    shadowColor: colors.gold.base,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ghost: {
    backgroundColor: colors.surface.panel,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm + 1,
    paddingVertical: space.lg,
    paddingHorizontal: space.xl,
    minHeight: 48,
  },
  label: {
    ...typography.button,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.45,
  },
});
