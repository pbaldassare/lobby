import { colors, radius, space } from '@lobby/shared/tokens';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export function QrCard({ value, size = 180 }: { value: string; size?: number }): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <QRCode value={value} size={size} backgroundColor={colors.ink.primary} color={colors.bg.base} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    padding: space.lg,
    borderRadius: radius.bizcard,
    backgroundColor: colors.ink.primary,
  },
});
