import { makeStyles, useTheme } from '@lobby/shared/theme';
import { Icon, Text } from '@lobby/shared/ui';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, View } from 'react-native';

const SLIDE = Easing.bezier(0.32, 0.72, 0, 1);
const TRAVEL = 18;

/** Quanto manca alla chiusura, in forma leggibile. Null = stanza permanente
 *  o già chiusa. */
function useTimeLeft(closesAt: string | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!closesAt) {
      setLabel(null);
      return;
    }
    const tick = () => {
      const ms = new Date(closesAt).getTime() - Date.now();
      if (ms <= 0) {
        setLabel(null);
        return;
      }
      const min = Math.floor(ms / 60000);
      setLabel(min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [closesAt]);

  return label;
}

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
  closesAt,
  onChange,
  onLeave,
}: {
  isVisible: boolean;
  roomName: string;
  /** Una serata finisce. Il permesso scade con lei. */
  closesAt?: string | null;
  onChange: (visible: boolean) => void | Promise<void>;
  onLeave: () => void | Promise<void>;
}): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const timeLeft = useTimeLeft(closesAt);
  const progress = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isVisible ? 1 : 0,
      duration: 240,
      easing: SLIDE,
      useNativeDriver: false,
    }).start();
  }, [isVisible, progress]);

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
        {timeLeft ? (
          <Text variant="tiny" tone="tertiary" numberOfLines={1}>
            · {timeLeft}
          </Text>
        ) : null}
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
      >
        <Animated.View
          style={[
            styles.track,
            {
              backgroundColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.color.bg.sunken, theme.color.signal.default],
              }),
              borderColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.color.border.strong, theme.color.signal.default],
              }),
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={theme.color.accent.on} />
          ) : (
            <Animated.View
              style={[
                styles.knob,
                {
                  backgroundColor: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.color.text.tertiary, theme.color.bg.canvas],
                  }),
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, TRAVEL],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </Animated.View>
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
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: t.color.text.tertiary,
  },
  leave: { paddingHorizontal: 8, paddingVertical: 6 },
  pressed: { opacity: 0.6 },
}));
