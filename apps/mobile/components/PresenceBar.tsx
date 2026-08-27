import { makeStyles, useTheme } from '@lobby/shared/theme';
import { Icon, Text } from '@lobby/shared/ui';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

/**
 * Stato della presenza in una pastiglia compatta.
 *
 * Prima erano due blocchi a tutta larghezza — un banner con tre righe di testo
 * più un bottone "Leave room" — impilati sopra il contenuto, che spingevano le
 * persone sotto la piega. La presenza è uno stato, non un'azione principale:
 * qui occupa una riga e la stanza torna a essere il contenuto.
 *
 * La visibilità resta opt-in e spenta di default: è una regola di prodotto,
 * non una preferenza di interfaccia.
 */
export function PresenceBar({
  isVisible,
  roomName,
  onChange,
  onLeave,
}: {
  isVisible: boolean;
  roomName: string;
  onChange: (visible: boolean) => void | Promise<void>;
  onLeave: () => void | Promise<void>;
}): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.status}>
        {isVisible ? (
          <Icon name="live" size={12} color={theme.color.signal.default} />
        ) : (
          <View style={styles.hidden} />
        )}
        <Text variant="small" tone={isVisible ? 'primary' : 'secondary'} numberOfLines={1}>
          {isVisible ? `Visibile in ${roomName}` : 'Invisibile'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Visibilità nella stanza"
        accessibilityState={{ checked: isVisible, busy }}
        disabled={busy}
        hitSlop={10}
        onPress={() => {
          setBusy(true);
          void Promise.resolve(onChange(!isVisible)).finally(() => setBusy(false));
        }}
        style={[styles.track, isVisible && styles.trackOn]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={theme.color.accent.on} />
        ) : (
          <View style={[styles.knob, isVisible && styles.knobOn]} />
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Esci dalla stanza"
        hitSlop={10}
        onPress={() => void onLeave()}
        style={({ pressed }) => [styles.leave, pressed && styles.pressed]}
      >
        <Text variant="tiny" tone="tertiary">
          Esci
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.border.strong,
    backgroundColor: t.color.bg.raised,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 },
  hidden: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: t.color.text.tertiary,
  },
  track: {
    width: 44,
    height: 26,
    borderRadius: t.radius.pill,
    backgroundColor: t.color.bg.sunken,
    borderWidth: 1,
    borderColor: t.color.border.strong,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: { backgroundColor: t.color.signal.default, borderColor: t.color.signal.default },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: t.color.text.tertiary,
  },
  knobOn: { alignSelf: 'flex-end', backgroundColor: t.color.bg.canvas },
  leave: { paddingHorizontal: 8, paddingVertical: 6 },
  pressed: { opacity: 0.6 },
}));
