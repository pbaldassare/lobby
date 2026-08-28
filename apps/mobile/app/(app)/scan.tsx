import { makeStyles, useTheme } from '@lobby/shared/theme';
import { Button, Text } from '@lobby/shared/ui';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

/** Il QR porta la stanza e il codice del momento. Il codice è la parte che
 *  conta: senza, il server non rilascia nessun permesso. */
function parseJoin(raw: string): { roomId: string; code: string | null } | null {
  try {
    const normalized = raw.includes('://')
      ? raw
      : raw.startsWith('join?')
        ? `lobby://${raw}`
        : raw;
    if (normalized.startsWith('lobby://room/')) {
      const roomId = normalized.replace('lobby://room/', '').split(/[?#]/)[0];
      return roomId ? { roomId, code: null } : null;
    }
    const url = new URL(normalized);
    const room = url.searchParams.get('room') ?? url.searchParams.get('roomId');
    if (room) return { roomId: room, code: url.searchParams.get('code') };
    return null;
  } catch {
    return null;
  }
}

/** Scansione dei QR Lobby: lobby://join?room=… oppure lobby://room/{id} */
export default function ScanScreen(): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text variant="titleLg">Serve la fotocamera</Text>
        <Text variant="body" tone="secondary" style={styles.centerText}>
          Solo per leggere i QR di Lobby. Niente foto, niente riprese.
        </Text>
        <Button label="Consenti" onPress={() => void requestPermission()} />
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
          const parsed = parseJoin(data);
          if (parsed) {
            setLocked(true);
            router.replace({
              pathname: '/(app)/join',
              params: parsed.code
                ? { room: parsed.roomId, code: parsed.code }
                : { room: parsed.roomId },
            });
            return;
          }
          if (data.startsWith('lobby://member/')) router.back();
        }}
      />

      {/* Mirino: prima non c'era nulla, si inquadrava a caso. */}
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
