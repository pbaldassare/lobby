import { colors, space, typography } from '@lobby/shared/tokens';
import { Avatar, Button, Card, Chip } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useChatList } from '@/hooks/useChat';
import { useSignals } from '@/hooks/useSignals';
import { initialsFromProfile } from '@/lib/format';

export default function SignalsScreen(): React.JSX.Element {
  const { signals, respondToSignal, loading } = useSignals();
  const { chats } = useChatList();
  const pendingIn = signals.filter((s) => s.direction === 'incoming' && s.status === 'pending');
  const pendingOut = signals.filter((s) => s.direction === 'outgoing' && s.status === 'pending');

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Signals & chat</Text>
        <Text style={styles.sub}>
          Connection only by mutual consent. Chat stays locked until both sides connect.
        </Text>
      </View>
      <Text style={styles.section}>Incoming</Text>
      {pendingIn.length === 0 ? (
        <Text style={styles.hint}>{loading ? 'Loading…' : 'No pending signals.'}</Text>
      ) : (
        pendingIn.map((s) => (
          <Card key={s.id} style={styles.card}>
            <View style={styles.row}>
              <Avatar initials={initialsFromProfile(s.other)} uri={s.other?.avatar_url} size={44} />
              <View style={styles.body}>
                <Text style={styles.name}>{s.other?.display_name ?? 'Member'}</Text>
                {s.message ? <Text style={styles.msg}>{s.message}</Text> : null}
              </View>
            </View>
            <View style={styles.actions}>
              <Button label="Connect" onPress={() => void respondToSignal(s.id, 'connected')} />
              <Button label="Decline" variant="ghost" onPress={() => void respondToSignal(s.id, 'declined')} />
            </View>
          </Card>
        ))
      )}
      <Text style={styles.section}>Outgoing</Text>
      {pendingOut.length === 0 ? (
        <Text style={styles.hint}>No pending outbound signals.</Text>
      ) : (
        pendingOut.map((s) => (
          <Card key={s.id} style={styles.card}>
            <Text style={styles.name}>{s.other?.display_name ?? 'Member'}</Text>
            <Chip label="Pending consent" />
          </Card>
        ))
      )}
      <Text style={styles.section}>Chats</Text>
      {chats.length === 0 ? (
        <Text style={styles.hint}>
          No chats yet. Accept a signal (or get accepted) to unlock messaging.
        </Text>
      ) : (
        chats.map((c) => (
          <Card key={c.id} onPress={() => router.push(`/(app)/chat/${c.id}`)} style={styles.card}>
            <View style={styles.row}>
              <Avatar initials={initialsFromProfile(c.other)} uri={c.other?.avatar_url} size={44} />
              <View style={styles.body}>
                <Text style={styles.name}>{c.other?.display_name ?? 'Member'}</Text>
                <Text style={styles.msg} numberOfLines={1}>
                  {c.lastMessage?.body ?? 'Connected — say hello'}
                </Text>
              </View>
              <Chip label="Connected" variant="match" />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.md },
  title: { ...typography.displayLg, color: colors.ink.primary },
  sub: { ...typography.sm, color: colors.ink.muted },
  section: { ...typography.displaySm, color: colors.ink.primary, marginTop: space.md },
  hint: { ...typography.sm, color: colors.ink.muted2 },
  card: { gap: space.md },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  body: { flex: 1, gap: 2 },
  name: { ...typography.labelStrong, color: colors.ink.primary },
  msg: { ...typography.sm, color: colors.ink.muted },
  actions: { gap: space.sm },
});
