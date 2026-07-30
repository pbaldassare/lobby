import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, space, typography } from '@lobby/shared';

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: space['3xl'],
    gap: space.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.ink.primary,
  },
  body: {
    ...typography.sm,
    color: colors.ink.muted,
  },
});
