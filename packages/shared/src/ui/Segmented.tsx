import React from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles } from '../theme';
import { Text } from './Text';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Mostrato accanto all'etichetta, es. il numero di elementi in attesa. */
  badge?: number;
};

/**
 * Controllo segmentato.
 *
 * Serve dove una schermata tiene insieme raccolte che non sono la stessa cosa
 * — richieste da evadere, stati da controllare, conversazioni da aprire — e
 * che prima stavano in un unico scorrimento separate solo da un titolo.
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

  return (
    <View style={styles.root} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;

        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text
              variant="tiny"
              tone={active ? 'primary' : 'secondary'}
              numberOfLines={1}
            >
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
    padding: 3,
    borderRadius: t.radius.sm,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
    backgroundColor: t.color.bg.raised,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: t.radius.sm - 2,
    /** Minimo 44pt di area toccabile insieme al padding del contenitore. */
    minHeight: 38,
  },
  itemActive: { backgroundColor: t.color.bg.sunken },
}));
