import React, { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

export type AvatarProps = {
  /** Iniziali di ripiego, es. "MR". */
  initials: string;
  uri?: string | null;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({
  initials,
  uri,
  size = 50,
  backgroundColor,
  style,
}: AvatarProps): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor ?? theme.color.accent.subtleBg,
        },
        style,
      ]}
    >
      <Text variant={size >= 44 ? 'name' : 'score'} tone="accent">
        {initials.slice(0, 2).toUpperCase()}
      </Text>
      {showImage ? (
        <Image
          source={{ uri: uri ?? undefined }}
          style={StyleSheet.absoluteFill}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
  },
}));
