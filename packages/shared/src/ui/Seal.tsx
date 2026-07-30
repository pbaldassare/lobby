import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, sealGradient } from '../tokens/colors';
import { fontFamily, fontWeight } from '../tokens/typography';

export type SealProps = {
  /** Monogramma venue (es. "SH") — il sigillo lo emette il VENUE */
  venueMark: string;
  venueBg?: string;
  venueFg?: string;
  size?: number;
  showCheck?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Sigillo di membership (elemento chiave brand).
 * Anello gold + logo venue + check verde — emesso dal club, non dall'utente.
 */
export function Seal({
  venueMark,
  venueBg = '#2A2620',
  venueFg = '#E8DCC6',
  size = 20,
  showCheck = true,
  style,
}: SealProps): React.JSX.Element {
  const checkSize = Math.max(11, Math.round(size * 0.55));
  const markSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: size >= 30 ? 2 : 1.5,
          backgroundColor: sealGradient.colors[0],
        },
        style,
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            borderWidth: Math.max(1.5, size * 0.08),
            borderColor: colors.gold.deep,
            opacity: 0.55,
          },
        ]}
      />
      <View
        style={[
          styles.logo,
          {
            backgroundColor: venueBg,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text
          style={{
            color: venueFg,
            fontFamily: fontFamily.display,
            fontWeight: fontWeight.bold,
            fontSize: markSize,
            lineHeight: markSize + 1,
          }}
        >
          {venueMark.slice(0, 2)}
        </Text>
      </View>
      {showCheck ? (
        <View
          style={[
            styles.check,
            {
              width: checkSize,
              height: checkSize,
              borderRadius: checkSize / 2,
              right: -Math.round(size * 0.15),
              bottom: -Math.round(size * 0.15),
            },
          ]}
        >
          <Text
            style={[
              styles.checkMark,
              { fontSize: Math.round(checkSize * 0.72) },
            ]}
          >
            ✓
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: colors.gold.light,
  },
  logo: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  check: {
    position: 'absolute',
    backgroundColor: colors.green.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg.elevated,
  },
  checkMark: {
    color: colors.green.onGreen,
    fontWeight: fontWeight.bold,
  },
});
