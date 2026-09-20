import { useTheme } from '@lobby/shared/theme';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Contenitore di schermata: fondo, safe area, scroll opzionale.
 *
 * `scroll={false}` serve alle schermate che gestiscono lo scorrimento da sé —
 * una `FlatList` non può stare dentro uno `ScrollView`.
 */
export function Screen({
  children,
  scroll = true,
  overTabBar = false,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  /** Lascia spazio alla tab bar flottante, arrotolata su tutti i lati. */
  overTabBar?: boolean;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const pad = {
    paddingTop: insets.top + 12,
    paddingLeft: Math.max(insets.left, 18),
    paddingRight: Math.max(insets.right, 18),
    paddingBottom: overTabBar
      ? 62 + Math.max(insets.bottom, 12) + 12
      : insets.bottom + 12,
  };

  const body = <View style={[styles.inner, style]}>{children}</View>;

  return (
    <View style={[styles.safe, { backgroundColor: theme.color.bg.canvas }, pad]}>
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
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  inner: { flex: 1, gap: 16 },
});
