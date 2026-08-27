import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type SealProps = {
  /** Monogramma del venue, es. "SH". Il sigillo lo emette il LOCALE. */
  venueMark: string;
  venueBg?: string;
  venueFg?: string;
  size?: number;
  showCheck?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Sigillo di membership — l'elemento identitario del prodotto.
 *
 * Certifica che il venue ti ha ammesso: è la sola cosa che in Lobby non puoi
 * dichiarare da solo. Nella direzione editoriale l'accento è tolto quasi
 * ovunque proprio perché qui torni a notarlo.
 *
 * La spunta è un'icona vettoriale: prima era il carattere `'✓'`, che cambia
 * forma da un font all'altro e non si può allineare in modo prevedibile.
 */
export function Seal({
  venueMark,
  venueBg,
  venueFg,
  size = 20,
  showCheck = true,
  style,
}: SealProps): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();

  const checkSize = Math.max(12, Math.round(size * 0.55));
  const ringWidth = Math.max(1.5, size * 0.07);

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          backgroundColor: venueBg ?? theme.color.bg.raised,
        },
        style,
      ]}
    >
      <Text
        variant="tiny"
        style={{
          color: venueFg ?? theme.color.accent.default,
          fontSize: Math.round(size * 0.4),
          lineHeight: Math.round(size * 0.4) + 1,
        }}
      >
        {venueMark.slice(0, 2)}
      </Text>

      {showCheck ? (
        <View
          style={[
            styles.check,
            {
              width: checkSize,
              height: checkSize,
              borderRadius: checkSize / 2,
              right: -Math.round(size * 0.14),
              bottom: -Math.round(size * 0.14),
            },
          ]}
        >
          <Icon
            name="check"
            size={Math.round(checkSize * 0.72)}
            color={theme.color.bg.canvas}
            strokeWidth={3}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  ring: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderColor: t.color.accent.default,
  },
  check: {
    position: 'absolute',
    backgroundColor: t.color.signal.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
