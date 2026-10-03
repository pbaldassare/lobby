import { makeStyles, useTheme } from '@lobby/shared/theme';
import { Button, Field, Text } from '@lobby/shared/ui';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { parseScan } from '@/lib/join';
import { usePresence } from '@/providers/PresenceProvider';

function openScan(raw: string, inRoom: boolean): boolean {
  const parsed = parseScan(raw);
  if (!parsed) return false;
  if (parsed.kind === 'join') {
    router.replace({
      pathname: '/(app)/join',
      params: {
        room: parsed.roomId,
        ...(parsed.code ? { code: parsed.code } : {}),
        ...(parsed.wifi ? { wifi: parsed.wifi } : {}),
        ...(parsed.method ? { method: parsed.method } : {}),
      },
    });
    return true;
  }
  if (parsed.profileId && inRoom) {
    router.replace({
      pathname: '/(app)/invite-guest',
      params: { profileId: parsed.profileId },
    });
    return true;
  }
  router.back();
  return true;
}

/** Scansione dei QR Lobby: lobby://join?room=…, https://…/join?room=…, oppure incolla il link. */
export default function ScanScreen(): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const { presence } = usePresence();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const cameraReady = Boolean(permission?.granted);

  const submitPaste = () => {
    setPasteError(null);
    if (openScan(paste, Boolean(presence))) return;
    setPasteError('Non è un QR o un link di Lobby.');
  };

  const pasteBlock = (
    <View style={styles.paste}>
      <Field
        label="Incolla il link o il codice"
        value={paste}
        onChangeText={setPaste}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://…/join?room=…  oppure  lobby://join?…"
        error={pasteError}
      />
      <Button label="Entra con questo link" onPress={submitPaste} />
    </View>
  );

  if (!permission) return <View style={styles.center} />;

  if (!cameraReady) {
    return (
      <View style={styles.center}>
        <Text variant="titleLg">{isWeb ? 'Entra con il link' : 'Serve la fotocamera'}</Text>
        <Text variant="body" tone="secondary" style={styles.centerText}>
          {isWeb
            ? 'Sul web puoi incollare il link del QR. La fotocamera è opzionale, e solo su HTTPS.'
            : 'Solo per leggere i QR di Lobby. Niente foto, niente riprese.'}
        </Text>
        {isWeb ? pasteBlock : null}
        <Button
          label={isWeb ? 'Usa la fotocamera' : 'Consenti'}
          variant={isWeb ? 'ghost' : 'gold'}
          onPress={() => void requestPermission()}
        />
        <Button label="Chiudi" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(event: { data: string }) => {
          const data = event.data;
          if (locked || last === data) return;
          setLast(data);
          if (openScan(data, Boolean(presence))) {
            setLocked(true);
          }
        }}
      />

      <View style={styles.reticleWrap} pointerEvents="none">
        <View style={[styles.corner, styles.tl, { borderColor: theme.color.accent.default }]} />
        <View style={[styles.corner, styles.tr, { borderColor: theme.color.accent.default }]} />
        <View style={[styles.corner, styles.bl, { borderColor: theme.color.accent.default }]} />
        <View style={[styles.corner, styles.br, { borderColor: theme.color.accent.default }]} />
      </View>

      <View style={styles.overlay}>
        <Text variant="bodyStrong" style={styles.centerText}>
          Inquadra il QR del locale
        </Text>
        <Text variant="tiny" tone="secondary" style={styles.centerText}>
          Entri invisibile: nessuno ti vede finché non lo decidi tu.
        </Text>
        {isWeb ? pasteBlock : null}
        <Button label="Chiudi" variant="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const RETICLE = 232;
const CORNER = 34;

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: '#000000' },
  center: {
    flex: 1,
    backgroundColor: t.color.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  centerText: { textAlign: 'center' },
  paste: { width: '100%', gap: 10 },
  reticleWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: RETICLE,
    height: RETICLE,
    marginLeft: -RETICLE / 2,
    marginTop: -RETICLE / 2,
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
  overlay: { position: 'absolute', left: 18, right: 18, bottom: 32, gap: 10 },
}));
