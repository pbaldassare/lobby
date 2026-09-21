import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { makeStyles } from '../theme';
import { Text } from './Text';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Mostrato accanto all'etichetta, es. il numero di elementi in attesa. */
  badge?: number;
};

const PAD = 4;
const SLIDE = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * Controllo segmentato con pastiglia che scorre.
 *
 * Serve dove una schermata tiene insieme raccolte o stati che non sono la
 * stessa cosa. Il salto a secco della selezione leggeva come un reload:
 * la pastiglia deve muoversi, come un toggle.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}): React.JSX.Element {
  const styles = useStyles();
  const [trackW, setTrackW] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const itemW = options.length > 0 ? Math.max(0, trackW - PAD * 2) / options.length : 0;
  const x = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  useEffect(() => {
    if (itemW <= 0) return;
    const to = index * itemW;
    if (!placed.current) {
      x.setValue(to);
      placed.current = true;
      return;
    }
    Animated.timing(x, {
      toValue: to,
      duration: 240,
      easing: SLIDE,
      useNativeDriver: true,
    }).start();
  }, [index, itemW, x]);

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.root} onLayout={onLayout} accessibilityRole="tablist">
      {itemW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.thumb, { width: itemW, transform: [{ translateX: x }] }]}
        />
      ) : null}
      {options.map((o) => {
        const active = o.value === value;

        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={styles.item}
          >
            <Text variant="small" tone={active ? 'primary' : 'secondary'} numberOfLines={1}>
              {o.label}
              {o.badge ? ` · ${o.badge}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    position: 'relative',
    padding: PAD,
    borderRadius: t.radius.pill,
    backgroundColor: t.color.bg.sunken,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: t.radius.pill,
    backgroundColor: t.color.bg.raised,
  },
  item: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 44,
  },
}));
