import { makeStyles, useTheme } from '@lobby/shared/theme';
import type { Message } from '@lobby/shared/types';
import { Avatar, Icon, ListEmpty, Text } from '@lobby/shared/ui';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChatList, useChatThread } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/providers/AuthProvider';
import { initialsFromProfile } from '@/lib/format';

/**
 * Conversazione.
 *
 * Questa schermata non aveva un'intestazione: niente indietro, niente nome,
 * niente avatar. Aprivi una chat e non sapevi con chi stavi parlando — una
 * funzione mancante, non un problema di stile.
 *
 * La lista è invertita: i messaggi nuovi stanno in fondo e ci si arriva senza
 * doverci scorrere a mano, che è quello che succedeva con `ScrollView`.
 */
export default function ChatThreadScreen(): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { chats } = useChatList();
  const { messages, connected, loading, sendMessage } = useChatThread(id);
  const { openPeerCv } = useDocuments();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const other = useMemo(() => chats.find((c) => c.id === id)?.other, [chats, id]);

  /** `inverted` disegna dal basso: l'ordine dei dati va rovesciato. */
  const ordered = useMemo(() => [...messages].reverse(), [messages]);

  const send = useCallback(() => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    void sendMessage(body).then((r) => {
      setSending(false);
      if (r.error) setError(r.error);
      else setDraft('');
    });
  }, [draft, sending, sendMessage]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const mine = item.sender_id === user?.id;
      return (
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          <Text variant="body">{item.body}</Text>
        </View>
      );
    },
    [user?.id, styles],
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Indietro"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <View style={styles.backIcon}>
            <Icon name="chevronRight" size={20} color={theme.color.text.secondary} />
          </View>
        </Pressable>

        {other ? (
          <Avatar initials={initialsFromProfile(other)} uri={other.avatar_url} size={34} />
        ) : null}

        <View style={styles.headerText}>
          <Text variant="name" numberOfLines={1}>
            {other?.display_name ?? 'Conversazione'}
          </Text>
          <Text variant="tiny" tone={connected ? 'signal' : 'tertiary'} numberOfLines={1}>
            {connected ? 'Connessi' : 'In attesa di consenso'}
          </Text>
        </View>

        {connected && other ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Curriculum"
            hitSlop={8}
            onPress={() => {
              void openPeerCv(other.id).then(({ error: err }) => {
                if (err) setError(err);
              });
            }}
            style={({ pressed }) => [styles.cvBtn, pressed && styles.pressed]}
          >
            <Text variant="tiny" tone="accent">
              CV
            </Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 56}
      >
        {!connected ? (
          <View style={styles.gate}>
            <Text variant="bodyStrong" tone="accent">
              La chat è chiusa
            </Text>
            <Text variant="small" tone="secondary">
              Si apre solo a connessione reciproca. Prima serve che un signal venga accettato.
            </Text>
          </View>
        ) : null}

        <FlatList
          inverted
          data={ordered}
          renderItem={renderItem}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <ListEmpty
                loading={loading}
                title={loading ? 'Carico' : connected ? 'Ancora niente' : 'Nessun messaggio'}
                body={connected && !loading ? 'Scrivi tu per primo.' : undefined}
              />
            </View>
          }
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            editable={connected}
            multiline
            placeholder={connected ? 'Scrivi un messaggio' : 'Serve la connessione'}
            placeholderTextColor={theme.color.text.tertiary}
            onSubmitEditing={send}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Invia"
            accessibilityState={{ disabled: !connected || !draft.trim() }}
            disabled={!connected || !draft.trim() || sending}
            hitSlop={8}
            onPress={send}
            style={({ pressed }) => [
              styles.send,
              (!connected || !draft.trim()) && styles.sendOff,
              pressed && styles.pressed,
            ]}
          >
            <Icon name="signals" size={20} color={theme.color.accent.on} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.error}>
            <Text variant="tiny" tone="danger">
              {error}
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, backgroundColor: t.color.bg.canvas },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.subtle,
  },
  back: { padding: 6 },
  /** Il chevron guarda a destra: ruotato diventa un "indietro" senza
   *  aggiungere una seconda icona al set. */
  backIcon: { transform: [{ rotate: '180deg' }] },
  headerText: { flex: 1, minWidth: 0 },
  cvBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
    backgroundColor: t.color.accent.subtleBg,
  },
  pressed: { opacity: 0.6 },
  gate: {
    margin: 18,
    padding: 14,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.accent.subtleBorder,
    backgroundColor: t.color.accent.subtleBg,
    gap: 6,
  },
  list: { padding: 18, gap: 8 },
  emptyWrap: { transform: [{ scaleY: -1 }] },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: t.radius.md,
    borderWidth: 1,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: t.color.accent.subtleBg,
    borderColor: t.color.accent.subtleBorder,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: t.color.bg.raised,
    borderColor: t.color.border.subtle,
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: t.color.border.strong,
    backgroundColor: t.color.bg.sunken,
    borderRadius: t.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    color: t.color.text.primary,
    ...t.type.body,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.accent.default,
  },
  sendOff: { opacity: 0.4 },
  error: { paddingHorizontal: 18, paddingBottom: 8 },
}));
