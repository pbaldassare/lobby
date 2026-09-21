import { makeStyles } from '@lobby/shared/theme';
import { Button, Card, Text } from '@lobby/shared/ui';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { isAndroidWeb, isIosSafari, isSecureWeb, isStandalonePwa } from '@/lib/pwa';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Come si mette Lobby sul telefono.
 *
 * Chrome/Android: `beforeinstallprompt` se c'è HTTPS; altrimenti il menu
 * del browser. iOS Safari non ha quel prompt: Condividi → Home.
 */
export function InstallBanner(): React.JSX.Element | null {
  const styles = useStyles();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalonePwa());
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const [secure, setSecure] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isStandalonePwa()) {
      setInstalled(true);
      return;
    }
    setIos(isIosSafari());
    setAndroid(isAndroidWeb());
    setSecure(isSecureWeb());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (Platform.OS !== 'web' || installed) return null;

  const how = ios
    ? 'Su iPhone: tocca Condividi, poi Aggiungi alla schermata Home. Si apre come un’app, senza barra del browser.'
    : android
      ? secure
        ? 'Su Android: tocca Installa, oppure il menu del browser → Installa app / Aggiungi a schermata Home.'
        : 'Su Android serve un indirizzo HTTPS. Apri Lobby dal link sicuro e poi Installa app nel menu del browser.'
      : 'Dal telefono: menu del browser → Aggiungi a schermata Home. Su iPhone: Condividi → Aggiungi alla schermata Home.';

  return (
    <Card style={styles.card}>
      <View style={styles.copy}>
        <Text variant="bodyStrong">Metti Lobby sul telefono</Text>
        <Text variant="tiny" tone="secondary">
          {how} Stessa privacy: invisibile finché non scegli tu.
        </Text>
      </View>
      {installEvent ? (
        <Button
          label="Installa"
          onPress={() => {
            void installEvent.prompt().then(() => setInstallEvent(null));
          }}
        />
      ) : (
        <Text variant="tiny" tone="tertiary">
          {ios
            ? 'Non c’è un pulsante Installa su iPhone: usa Condividi in basso.'
            : 'Se non vedi Installa, apri il menu del browser (⋮) e scegli Aggiungi a schermata Home.'}
        </Text>
      )}
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 12, padding: 16 },
  copy: { gap: 4 },
}));
