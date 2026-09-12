import React from 'react';
import { View } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

/**
 * Icona in un cerchio — stesso segno delle schermate utente (header, empty).
 */
export function GlyphMark({
  name,
  size = 40,
}: {
  name: IconName;
  size?: number;
}): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Icon
        name={name}
        size={Math.round(size * 0.48)}
        color={theme.color.accent.default}
        strokeWidth={1.8}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.accent.subtleBg,
  },
}));
