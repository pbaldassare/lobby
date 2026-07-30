import { colors, space } from '@lobby/shared/tokens';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: insets.top + space.md,
    paddingLeft: Math.max(insets.left, space.screenX),
    paddingRight: Math.max(insets.right, space.screenX),
    paddingBottom: insets.bottom + space.md,
  };

  const body = <View style={[styles.inner, style]}>{children}</View>;

  return (
    <View style={[styles.safe, pad]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },
  scroll: { flexGrow: 1, paddingBottom: space['3xl'] },
  inner: { flex: 1, gap: space.xl },
});
