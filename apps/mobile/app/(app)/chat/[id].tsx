import { colors, radius, space, typography } from '@lobby/shared/tokens';
import { Button } from '@lobby/shared/ui';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChatThread } from '@/hooks/useChat';
import { useAuth } from '@/providers/AuthProvider';

export default function ChatThreadScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { messages, connected, loading, sendMessage } = useChatThread(id);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        {!connected ? (
          <View style={styles.gate}>
            <Text style={styles.gateTitle}>Chat locked</Text>
            <Text style={styles.gateBody}>
              Messaging unlocks only after mutual connection. Accept or exchange a
              signal first.
            </Text>
          </View>
        ) : null}
        <ScrollView contentContainerStyle={styles.list}>
          {messages.length === 0 ? (
            <Text style={styles.empty}>
              {loading ? 'Loading…' : connected ? 'Say hello.' : 'No messages.'}
            </Text>
          ) : (
            messages.map((item) => {
              const mine = item.sender_id === user?.id;
              return (
                <View
                  key={item.id}
                  style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                >
                  <Text style={styles.bubbleText}>{item.body}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            editable={connected}
            placeholder={connected ? 'Message' : 'Connect first'}
            placeholderTextColor={colors.ink.muted2}
          />
          <Button
            label="Send"
            disabled={!connected}
            style={styles.send}
            onPress={() => {
              setError(null);
              void sendMessage(draft).then((r) => {
                if (r.error) setError(r.error);
                else setDraft('');
              });
            }}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },
  flex: { flex: 1 },
  gate: {
    margin: space.screenX,
    padding: space.lg,
    borderRadius: radius.glass,
    borderWidth: 1,
    borderColor: colors.border.gold,
    backgroundColor: colors.fill.goldWash,
    gap: space.sm,
  },
  gateTitle: { ...typography.labelStrong, color: colors.gold.base },
  gateBody: { ...typography.sm, color: colors.ink.muted },
  list: { padding: space.screenX, gap: space.sm, paddingBottom: space.xl },
  empty: {
    ...typography.sm,
    color: colors.ink.muted2,
    textAlign: 'center',
    marginTop: space['3xl'],
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderRadius: radius.bub,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.fill.goldSoft,
    borderWidth: 1,
    borderColor: colors.border.goldSoft,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface.panel,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  bubbleText: { ...typography.body, color: colors.ink.primary },
  composer: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.screenX,
    paddingBottom: space.md,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    borderRadius: radius.field,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    color: colors.ink.primary,
    ...typography.body,
  },
  send: { width: 96 },
  error: {
    ...typography.tiny,
    color: '#E88',
    paddingHorizontal: space.screenX,
    paddingBottom: space.sm,
  },
});
