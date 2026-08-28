import { makeStyles, useTheme } from '@lobby/shared/theme';
import type { Profile } from '@lobby/shared/types';
import { Avatar, Button, Field, Icon, ListEmpty, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { useChatList } from '@/hooks/useChat';
import { useIntros } from '@/hooks/useIntros';
import { initialsFromProfile } from '@/lib/format';

/**
 * Presentare due persone.
 *
 * È il meccanismo più forte del networking e in Lobby non c'era: la tabella
 * esisteva, le regole pure, ma nessuna schermata. Vale più di qualsiasi
 * punteggio di affinità perché ci mette in mezzo la tua reputazione — e per
 * questo il server accetta solo coppie con cui sei connesso davvero.
 */
export default function IntroduceScreen(): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const { chats } = useChatList();
  const { introduce } = useIntros();

  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Le connessioni: la chat esiste solo dopo il consenso di entrambi,
   *  quindi è già l'elenco di chi puoi presentare. */
  const connections = useMemo(
    () => chats.map((c) => c.other).filter((p): p is Profile => Boolean(p)),
    [chats],
  );

  const toggle = (id: string) => {
    setError(null);
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 2 ? prev : [...prev, id],
    );
  };

  const send = () => {
    if (picked.length !== 2) return;
    setBusy(true);
    setError(null);
    void introduce(picked[0]!, picked[1]!, message).then(({ error: err }) => {
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      router.back();
    });
  };

  if (connections.length < 2) {
    return (
      <View style={styles.root}>
        <ListEmpty
          icon="matches"
          title="Servono almeno due connessioni"
          body="Presenti solo persone con cui sei già connesso: è quello che rende una presentazione qualcosa di più di un contatto passato."
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text variant="small" tone="secondary">
          Scegli due persone. Ricevono entrambe la presentazione con il tuo nome
          sopra: sei tu a metterci la faccia.
        </Text>

        <View style={styles.list}>
          {connections.map((p) => {
            const on = picked.includes(p.id);
            const full = picked.length >= 2 && !on;

            return (
              <Pressable
                key={p.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled: full }}
                disabled={full}
                onPress={() => toggle(p.id)}
                style={({ pressed }) => [
                  styles.row,
                  on && styles.rowOn,
                  full && styles.rowOff,
                  pressed && styles.pressed,
                ]}
              >
                <Avatar initials={initialsFromProfile(p)} uri={p.avatar_url} size={40} />
                <View style={styles.rowText}>
                  <Text variant="name" numberOfLines={1}>
                    {p.display_name ?? 'Membro'}
                  </Text>
                  <Text variant="tiny" tone="tertiary" numberOfLines={1}>
                    {p.headline ?? p.company ?? 'Membro'}
                  </Text>
                </View>
                {on ? <Icon name="check" size={18} color={theme.color.signal.default} strokeWidth={2.4} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Perché dovrebbero parlarsi"
          value={message}
          onChangeText={setMessage}
          placeholder="Mia investe in clima industriale, Tomás costruisce il software."
          multiline
          inputStyle={styles.multiline}
          error={error}
        />

        <Button
          label={picked.length === 2 ? 'Presenta' : `Scegli ${2 - picked.length} in più`}
          disabled={picked.length !== 2}
          loading={busy}
          onPress={send}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  scroll: { padding: 18, gap: 14 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
    backgroundColor: t.color.bg.raised,
    minHeight: 56,
  },
  rowOn: { borderColor: t.color.signal.border, backgroundColor: t.color.signal.subtleBg },
  rowOff: { opacity: 0.45 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { opacity: 0.7 },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
}));
