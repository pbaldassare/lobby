import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { space } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export type ChipVariant = 'default' | 'on' | 'match';

export type ChipProps = {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Chip filtro / tag. `on` = gold attivo; `match` = green (looking-for / match tag).
 */
export function Chip({
  label,
  variant = 'default',
  selected,
  onPress,
  style,
}: ChipProps): React.JSX.Element {
  const resolved: ChipVariant =
    selected === true ? 'on' : selected === false ? 'default' : variant;

  const content = (
    <Text style={[styles.label, labelStyle(resolved)]}>{label}</Text>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          chipSurface(resolved),
          pressed && styles.pressed,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.base, chipSurface(resolved), style]}>{content}</View>;
}

function chipSurface(variant: ChipVariant): ViewStyle {
  switch (variant) {
    case 'on':
      return {
        backgroundColor: colors.fill.goldSoft,
        borderColor: colors.border.goldStrong,
      };
    case 'match':
      return {
        backgroundColor: colors.fill.greenSoft,
        borderColor: colors.border.green,
      };
    default:
      return {
        backgroundColor: colors.surface.panelHover,
        borderColor: colors.border.subtle,
      };
  }
}

function labelStyle(variant: ChipVariant): TextStyle {
  switch (variant) {
    case 'on':
      return { color: colors.gold.base, fontWeight: '600' };
    case 'match':
      return { color: colors.green.base, fontWeight: '600' };
    default:
      return { color: colors.ink.muted };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: space.xs + 2,
    paddingHorizontal: space.md - 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.chip,
  },
  pressed: {
    opacity: 0.85,
  },
});
