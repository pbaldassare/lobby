import { colors, typography } from '@lobby/shared/tokens';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        ...typography.tab,
        color: focused ? colors.gold.base : colors.ink.muted2,
        marginBottom: 4,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface.tabBar,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.gold.base,
        tabBarInactiveTintColor: colors.ink.muted2,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Room" focused={focused} /> }}
      />
      <Tabs.Screen
        name="matches"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Matches" focused={focused} /> }}
      />
      <Tabs.Screen
        name="showcase"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Showcase" focused={focused} /> }}
      />
      <Tabs.Screen
        name="card"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Card" focused={focused} /> }}
      />
      <Tabs.Screen
        name="signals"
        options={{ tabBarLabel: ({ focused }) => <TabLabel label="Signals" focused={focused} /> }}
      />
    </Tabs>
  );
}
