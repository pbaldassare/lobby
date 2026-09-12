import { makeStyles } from '@lobby/shared/theme';
import { Button, Text } from '@lobby/shared/ui';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { usePresence } from '@/providers/PresenceProvider';

/**
 * Portare un ospite. Chi è già dentro (pass valido) può sbloccare un altro
 * profilo: è lo stesso permesso, rilasciato da una persona invece che da un QR.
 */
export default function InviteGuestScreen(): React.JSX.Element {
  const styles = useStyles();
  const { presence, inviteToRoom } = usePresence();
  const params = useLocalSearchParams<{ profileId?: string }>();
  const guestId = typeof params.profileId === 'string' ? params.profileId : '';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const send = () => {
    if (!guestId) return;
    setBusy(true);
    setError(null);
    void inviteToRoom(guestId).then(({ error: err }) => {
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setDone(true);
    });
  };

  return (
    <Screen>
      <View style={styles.stack}>
        <Text variant="titleLg">{done ? 'Invito inviato' : 'Porta un ospite'}</Text>
        <Text variant="body" tone="secondary">
          {done
            ? 'Ha un permesso per questa stanza. Entra invisibile, come tutti.'
            : presence
              ? 'Stai per rilasciare un permesso a chi hai appena inquadrato. Vale finché è aperta la stanza.'
              : 'Devi essere tu dentro la stanza per portare qualcuno.'}
        </Text>
        {error ? (
          <Text variant="tiny" tone="danger">
            {error}
          </Text>
        ) : null}
        {!done && guestId && presence ? (
          <Button label="Invita in questa stanza" loading={busy} onPress={send} />
        ) : null}
        <Button
          label={done ? 'Chiudi' : 'Annulla'}
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  stack: { gap: 14, paddingVertical: 32 },
}));
