import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { space } from '../tokens/spacing';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Altezza massima relativa (0–1), default 0.9 come nel mockup */
  maxHeightRatio?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bottom sheet con scrim + grab handle (profilo / pitch / travel del mockup).
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.9,
  style,
}: BottomSheetProps): React.JSX.Element {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const maxHeight = Dimensions.get('window').height * maxHeightRatio;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(40);
      opacity.setValue(0);
    }
  }, [visible, opacity, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Close sheet"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight, transform: [{ translateY }] },
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface.scrim,
  },
  sheet: {
    backgroundColor: colors.bg.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderColor: colors.border.strong,
    paddingHorizontal: space.sheetPad,
    paddingTop: space.xl + 2,
    paddingBottom: space['3xl'],
  },
  grab: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: radius.xs,
    backgroundColor: colors.surface.grab,
    marginBottom: space.xl,
  },
  content: {
    paddingBottom: space.sm,
  },
});
