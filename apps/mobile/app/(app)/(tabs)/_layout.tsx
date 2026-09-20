import { useTheme } from '@lobby/shared/theme';
import { Icon, Text, type IconName } from '@lobby/shared/ui';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  { name: 'discover', icon: 'room', label: 'Stanza' },
  { name: 'matches', icon: 'matches', label: 'Match' },
  { name: 'showcase', icon: 'showcase', label: 'Progetti' },
  { name: 'signals', icon: 'signals', label: 'Signal' },
  { name: 'memory', icon: 'memory', label: 'Memoria' },
  { name: 'card', icon: 'card', label: 'Card' },
];

export default function TabsLayout(): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Math.max(insets.bottom, 12),
          height: 62,
          paddingTop: 6,
          paddingBottom: 6,
          backgroundColor: theme.color.bg.raised,
          borderWidth: 1,
          borderTopWidth: 1,
          borderColor: theme.color.border.subtle,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: { flex: 1, minWidth: 0 },
      }}
    >
      {TABS.map(({ name, icon, label }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ focused }) => (
              <TabItem
                icon={icon}
                label={label}
                focused={focused}
                activeColor={theme.color.accent.default}
                idleColor={theme.color.text.tertiary}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
