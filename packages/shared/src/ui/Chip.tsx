import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles } from '../theme';
import { Text, type TextTone } from './Text';

export type ChipVariant = 'default' | 'on' | 'match';

export type ChipProps = {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const TONE: Record<ChipVariant, TextTone> = {
  default: 'secondary',
  on: 'accent',
  match: 'signal',
};

/**
 * Tag o filtro. `on` = selezionato (accento); `match` = semantico (cosa cerca).
 */
export function Chip({
  label,
  variant = 'default',
  selected,
  onPress,
  style,
}: ChipProps): React.JSX.Element {
  const styles = useStyles();
  const resolved: ChipVariant =
    selected === true ? 'on' : selected === false ? 'default' : variant;

  const content = (
    <Text variant="tiny" tone={TONE[resolved]}>
      {label}
    </Text>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: resolved === 'on' }}
        onPress={onPress}
        hitSlop={6}
        style={({ pressed }) => [styles.base, styles[resolved], pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.base, styles[resolved], style]}>{content}</View>;
}

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radius.pill,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 9,
    alignSelf: 'flex-start',
  },
  pressed: { opacity: 0.72 },
  default: { backgroundColor: t.color.bg.raised, borderColor: t.color.border.subtle },
  on: { backgroundColor: t.color.accent.subtleBg, borderColor: t.color.accent.subtleBorder },
  match: { backgroundColor: t.color.signal.subtleBg, borderColor: t.color.signal.border },
}));
