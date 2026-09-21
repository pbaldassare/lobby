import { makeStyles } from '@lobby/shared/theme';
import { Button, Card, Text } from '@lobby/shared/ui';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { isAndroidWeb, isIosSafari, isStandalonePwa } from '@/lib/pwa';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * Pulsante Installa sempre visibile su web.
 * Se Chrome ha già `beforeinstallprompt`, apre il dialog nativo.
 * Altrimenti mostra i passi (iPhone / Android): Safari e Chrome iOS
 * non hanno un prompt di sistema.
 */
export function InstallBanner(): React.JSX.Element | null {
  const styles = useStyles();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalonePwa());
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isStandalonePwa()) {
      setInstalled(true);
      return;
    }
    setIos(isIosSafari());
    setAndroid(isAndroidWeb());

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

  const onInstall = () => {
    if (installEvent) {
      void installEvent.prompt().then(() => setInstallEvent(null));
      return;
    }
    setHelp(true);
  };

  const steps = ios
    ? 'Tocca Condividi (il quadrato con la freccia in alto) in basso al Safari, poi Aggiungi alla schermata Home. Conferma Aggiungi.'
    : android
      ? 'Tocca Installa se compare il dialog. Altrimenti il menu ⋮ in alto a destra → Installa app oppure Aggiungi a schermata Home.'
      : 'Dal telefono: su iPhone Condividi → Aggiungi alla schermata Home. Su Android il menu ⋮ → Installa app.';

  return (
    <Card style={styles.card}>
      <View style={styles.copy}>
        <Text variant="bodyStrong">Installa Lobby</Text>
        <Text variant="tiny" tone="secondary">
          Sul telefono si apre come un’app, senza barra del browser. Resti
          invisibile finché non lo decidi tu.
        </Text>
      </View>
      <Button label="Installa" onPress={onInstall} />
      {help ? (
        <Text variant="small" tone="secondary">
          {steps}
        </Text>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 12, padding: 16 },
  copy: { gap: 4 },
}));
