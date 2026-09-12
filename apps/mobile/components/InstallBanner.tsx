import { makeStyles } from '@lobby/shared/theme';
import { Button, Card, Text } from '@lobby/shared/ui';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { isIosSafari, isStandalonePwa } from '@/lib/pwa';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Chrome/Android: native install prompt.
 * iOS Safari: Share → Add to Home Screen (no beforeinstallprompt).
 */
export function InstallBanner(): React.JSX.Element | null {
  const styles = useStyles();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalonePwa());
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isStandalonePwa()) {
      setInstalled(true);
      return;
    }
    setIosHint(isIosSafari());

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
  if (!installEvent && !iosHint) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.copy}>
        <Text variant="bodyStrong">Installa Lobby</Text>
        <Text variant="tiny" tone="secondary">
          {iosHint
            ? 'Su iPhone: Condividi → Aggiungi alla schermata Home. Si apre come un’app, senza barra del browser.'
            : 'Aggiungila alla schermata Home. Stessa privacy: invisibile finché non scegli tu.'}
        </Text>
      </View>
      {installEvent ? (
        <Button
          label="Installa"
          onPress={() => {
            void installEvent.prompt().then(() => setInstallEvent(null));
          }}
        />
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 12, padding: 16 },
  copy: { gap: 4 },
}));
