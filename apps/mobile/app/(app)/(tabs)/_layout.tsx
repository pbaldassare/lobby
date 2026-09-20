import { useTheme } from '@lobby/shared/theme';
import { Icon, Text, type IconName } from '@lobby/shared/ui';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_BOTTOM, TAB_BAR_HEIGHT, TAB_BAR_SIDE } from '@/components/tabBarMetrics';

/** Pulsante di tab: icona + etichetta, sempre visibili. */
function TabItem({
  icon,
  label,
  focused,
  activeColor,
  idleColor,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
  activeColor: string;
  idleColor: string;
}): React.JSX.Element {
  const color = focused ? activeColor : idleColor;

  return (
    <View style={{ alignItems: 'center', gap: 4, minWidth: 44 }}>
      <Icon name={icon} size={22} color={color} strokeWidth={focused ? 2.1 : 1.6} />
      <Text variant="tab" style={{ color }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const TABS: { name: string; icon: IconName; label: string }[] = [
  { name: 'discover', icon: 'room', label: 'Home' },
  { name: 'signals', icon: 'signals', label: 'Richieste' },
  { name: 'memory', icon: 'memory', label: 'Storico' },
  { name: 'card', icon: 'card', label: 'Profilo' },
];

/** Route lasciate nel folder tabs per i deep link, nascoste dalla barra. */
const HIDDEN_TABS = ['matches', 'showcase'] as const;

type AppTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Tab bar nostra, non quella di React Navigation.
 *
 * La barra nativa applica `start: 0; end: 0; bottom: 0` e resta nel flusso:
 * `borderRadius` si vede solo in alto, i lati restano a tutta larghezza.
 * Qui la pastiglia è staccata dal bordo e arrotondata su tutti e quattro i lati.
 */
function FloatingTabBar({ state, navigation }: AppTabBarProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: TAB_BAR_SIDE,
        paddingBottom: Math.max(insets.bottom, TAB_BAR_BOTTOM),
        backgroundColor: 'transparent',
        pointerEvents: 'box-none',
      }}
    >
      <View
        role="tablist"
        style={{
          height: TAB_BAR_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.color.bg.raised,
          borderWidth: 1,
          borderColor: theme.color.border.subtle,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = TABS.find((tab) => tab.name === route.name);
          if (!meta) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={onPress}
              style={{
                flex: 1,
                minWidth: 0,
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <TabItem
                icon={meta.icon}
                label={meta.label}
                focused={focused}
                activeColor={theme.color.accent.default}
                idleColor={theme.color.text.tertiary}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      {TABS.map(({ name, label }) => (
        <Tabs.Screen key={name} name={name} options={{ title: label }} />
      ))}
      {HIDDEN_TABS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
