import { makeStyles } from '@lobby/shared/theme';
import {
  Avatar,
  Button,
  Card,
  Chip,
  ListEmpty,
  ScreenHeader,
  Segmented,
  Text,
} from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useChatList } from '@/hooks/useChat';
import { useSignals } from '@/hooks/useSignals';
import { initialsFromProfile } from '@/lib/format';

type Tab = 'in' | 'out' | 'chats';

/**
 * Tre raccolte che non sono la stessa cosa: in arrivo è azionabile, inviati è
 * stato, le chat sono navigazione. Prima stavano in un unico scorrimento
 * piatto separate da tre titoli, e le azioni erano due barre impilate.
 */
export default function SignalsScreen(): React.JSX.Element {
  const styles = useStyles();
  const { signals, respondToSignal, loading } = useSignals();
  const { chats } = useChatList();
  const [tab, setTab] = useState<Tab>('in');

  const pendingIn = signals.filter((s) => s.direction === 'incoming' && s.status === 'pending');
  const pendingOut = signals.filter((s) => s.direction === 'outgoing' && s.status === 'pending');

  return (
    <Screen>
      <ScreenHeader
        title="Signal"
        subtitle="Ci si connette solo se lo vogliono entrambi. La chat resta chiusa fino ad allora."
      />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'in', label: 'In arrivo', badge: pendingIn.length },
          { value: 'out', label: 'Inviati', badge: pendingOut.length },
          { value: 'chats', label: 'Chat', badge: chats.length },
        ]}
      />

      {tab === 'in' ? (
        pendingIn.length === 0 ? (
          <ListEmpty
            loading={loading}
            icon="signals"
            title={loading ? 'Controllo' : 'Nessuna richiesta in attesa'}
            body={loading ? undefined : 'Quando qualcuno ti manda un signal lo trovi qui.'}
          />
        ) : (
          pendingIn.map((s) => (
            <Card key={s.id} style={styles.card}>
              <View style={styles.row}>
                <Avatar
                  initials={initialsFromProfile(s.other)}
                  uri={s.other?.avatar_url}
                  size={44}
                />
                <View style={styles.body}>
                  <Text variant="name">{s.other?.display_name ?? 'Membro'}</Text>
                  {s.message ? (
                    <Text variant="small" tone="secondary" numberOfLines={2}>
                      {s.message}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.actions}>
                <Button
                  label="Connetti"
                  style={styles.action}
                  onPress={() => void respondToSignal(s.id, 'connected')}
                />
                <Button
                  label="Rifiuta"
                  variant="ghost"
                  style={styles.action}
                  onPress={() => void respondToSignal(s.id, 'declined')}
                />
              </View>
            </Card>
          ))
        )
      ) : null}

      {tab === 'out' ? (
        pendingOut.length === 0 ? (
          <ListEmpty
            icon="signals"
            title="Nessun signal in attesa"
            body="Quelli che mandi restano qui finché non rispondono."
          />
        ) : (
          pendingOut.map((s) => (
            <Card key={s.id} style={styles.cardTight}>
              <View style={styles.row}>
                <Avatar
                  initials={initialsFromProfile(s.other)}
                  uri={s.other?.avatar_url}
                  size={44}
                />
                <View style={styles.body}>
                  <Text variant="name">{s.other?.display_name ?? 'Membro'}</Text>
                  <Text variant="tiny" tone="tertiary">
                    In attesa di consenso
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )
      ) : null}

      {tab === 'chats' ? (
        chats.length === 0 ? (
          <ListEmpty
            icon="signals"
            title="Ancora nessuna conversazione"
            body="Accetta un signal, o fatti accettare, e la chat si apre."
          />
        ) : (
          chats.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={() => router.push(`/(app)/chat/${c.id}`)}
              style={({ pressed }) => [styles.chatRow, pressed && styles.pressed]}
            >
              <Avatar initials={initialsFromProfile(c.other)} uri={c.other?.avatar_url} size={44} />
              <View style={styles.body}>
                <Text variant="name">{c.other?.display_name ?? 'Membro'}</Text>
                <Text variant="small" tone="secondary" numberOfLines={1}>
                  {c.lastMessage?.body ?? 'Connessi — mandagli un saluto'}
                </Text>
              </View>
              <Chip label="Connessi" variant="match" />
            </Pressable>
          ))
        )
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  card: { gap: 12 },
  cardTight: { gap: 0 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  body: { flex: 1, minWidth: 0, gap: 2 },
  /** Affiancati, non impilati: sono la stessa decisione vista da due lati. */
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: t.color.border.subtle,
  },
  pressed: { opacity: 0.6 },
}));
