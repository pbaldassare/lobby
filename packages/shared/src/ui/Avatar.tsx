import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { fontFamily, fontWeight } from '../tokens/typography';

export type AvatarProps = {
  /** Iniziali fallback (es. "MR") */
  initials: string;
  uri?: string | null;
  size?: number;
  /** Gradiente mockup come colore solido di fallback */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Avatar circolare: foto se disponibile, altrimenti iniziali su tinta brand.
 */
export function Avatar({
  initials,
  uri,
  size = 50,
  backgroundColor = colors.gold.deep,
  style,
}: AvatarProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;
  const fontSize = Math.round(size * 0.32);

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize,
            lineHeight: fontSize + 2,
          },
        ]}
      >
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

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    color: colors.gold.onGold,
  },
});
