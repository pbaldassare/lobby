import { colors, radius, space, typography } from '@lobby/shared/tokens';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Opt-in room visibility control. Default OFF (product rule).
 */
export function VisibilityToggle({
  isVisible,
  onChange,
}: {
  isVisible: boolean;
  onChange: (visible: boolean) => void | Promise<void>;
}): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  return (
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.kicker}>Visibility</Text>
        <Text style={styles.title}>
          {isVisible ? 'Visible in this room' : 'Invisible (default)'}
        </Text>
        <Text style={styles.body}>
          {isVisible
            ? 'Others in the room can see you. Turn off anytime — leaving clears presence.'
            : 'You are present but hidden. Opt in to appear in discovery.'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: isVisible }}
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void Promise.resolve(onChange(!isVisible)).finally(() => setBusy(false));
        }}
        style={[styles.switch, isVisible && styles.switchOn]}
      >
        {busy ? (
          <ActivityIndicator color={colors.gold.onGold} />
        ) : (
          <View style={[styles.knob, isVisible && styles.knobOn]} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.glass,
    borderWidth: 1,
    borderColor: colors.border.goldSoft,
    backgroundColor: colors.fill.goldWash,
    padding: space.lg,
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
  },
  copy: { flex: 1, gap: space.xs },
  kicker: { ...typography.kicker, color: colors.gold.base },
  title: { ...typography.bodyStrong, color: colors.ink.primary },
  body: { ...typography.sm, color: colors.ink.muted },
  switch: {
    width: 52,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface.toggleOff,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  switchOn: { backgroundColor: colors.green.base },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink.primary,
  },
  knobOn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.green.onGreen,
  },
});
