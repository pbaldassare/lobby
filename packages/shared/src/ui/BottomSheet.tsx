import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { makeStyles } from '../theme';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Altezza massima relativa allo schermo (0–1). */
  maxHeightRatio?: number;
  style?: StyleProp<ViewStyle>;
};

const IN = 300;
const OUT = 200;

/**
 * Foglio dal basso.
 *
 * Prima animava solo l'entrata: alla chiusura i valori venivano riportati a
 * zero di colpo, quindi il foglio spariva senza uscita. Ora esce, e più in
 * fretta di quanto entri — è la regola: uscire lento sembra un ritardo.
 *
 * `useWindowDimensions` al posto di `Dimensions.get()` letto una volta sola:
 * quello non rispondeva alla rotazione.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.9,
  style,
}: BottomSheetProps): React.JSX.Element | null {
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  /** Tiene la modale montata finché l'uscita non è finita. */
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: IN, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: IN, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (!mounted) return;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: OUT, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 40, duration: OUT, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, mounted, opacity, translateY]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Chiudi"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: height * maxHeightRatio, transform: [{ translateY }], opacity },
            style,
          ]}
        >
          <View style={styles.grab} />
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: t.scheme === 'dark' ? 'rgba(0,0,0,0.65)' : 'rgba(20,18,16,0.45)',
  },
  sheet: {
    backgroundColor: t.color.bg.raised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: t.color.border.strong,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  grab: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.color.border.strong,
    marginBottom: 16,
  },
  content: { paddingBottom: 8 },
}));
