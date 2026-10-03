import { useTheme } from '@lobby/shared/theme';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/** On desktop browsers the member app stays phone-width, like the installed PWA. */
export function WebAppFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  const theme = useTheme();
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  return (
    <View style={[styles.letterbox, { backgroundColor: theme.color.bg.sunken }]}>
      <View
        style={[
          styles.phone,
          {
            backgroundColor: theme.color.bg.canvas,
            borderColor: theme.color.border.subtle,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  letterbox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
