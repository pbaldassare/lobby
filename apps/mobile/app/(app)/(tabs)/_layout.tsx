import { useTheme } from '@lobby/shared/theme';
import { Icon, Text, type IconName } from '@lobby/shared/ui';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

/**
 * Tab bar.
 *
 * Prima erano sole etichette a 9,5px, sotto il minimo leggibile e senza
 * nessun appiglio visivo. Ora icona più etichetta a 11px.
 */
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
    <View style={{ alignItems: 'center', gap: 3, width: 64 }}>
      <Icon name={icon} size={21} color={color} strokeWidth={focused ? 2 : 1.6} />
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
  { name: 'card', icon: 'card', label: 'Card' },
  { name: 'signals', icon: 'signals', label: 'Signal' },
];

export default function TabsLayout(): React.JSX.Element {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.color.bg.canvas,
          borderTopColor: theme.color.border.subtle,
          borderTopWidth: 1,
          height: 66,
          paddingTop: 8,
        },
      }}
    >
      {TABS.map(({ name, icon, label }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
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
