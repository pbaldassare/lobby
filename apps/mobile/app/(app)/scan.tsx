import { colors, space, typography } from '@lobby/shared/tokens';
import { Button } from '@lobby/shared/ui';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function parseJoin(raw: string): { roomId: string } | null {
  try {
    const normalized = raw.includes('://')
      ? raw
      : raw.startsWith('join?')
        ? `lobby://${raw}`
        : raw;
    if (normalized.startsWith('lobby://room/')) {
      const roomId = normalized.replace('lobby://room/', '').split(/[?#]/)[0];
      return roomId ? { roomId } : null;
    }
    const url = new URL(normalized);
    const room =
      url.searchParams.get('room') ?? url.searchParams.get('roomId');
    if (room) return { roomId: room };
    return null;
  } catch {
    return null;
  }
}

/** Scan Lobby QR: lobby://join?room=… or lobby://room/{id} */
export default function ScanScreen(): React.JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access</Text>
        <Text style={styles.sub}>Needed to scan Lobby QR codes.</Text>
        <Button label="Grant permission" onPress={() => void requestPermission()} />
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
              params: { room: parsed.roomId },
            });
            return;
          }
          if (data.startsWith('lobby://member/')) {
            router.back();
          }
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.hint}>
          Align QR within the frame — you enter invisible by default.
        </Text>
        {last ? <Text style={styles.last}>{last}</Text> : null}
        <Button label="Close" variant="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.black },
  center: {
    flex: 1,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.screenX,
    gap: space.md,
  },
  title: { ...typography.displayMd, color: colors.ink.primary },
  sub: { ...typography.sm, color: colors.ink.muted, textAlign: 'center' },
  overlay: {
    position: 'absolute',
    left: space.screenX,
    right: space.screenX,
    bottom: space['3xl'],
    gap: space.md,
  },
  hint: { ...typography.labelStrong, color: colors.ink.primary, textAlign: 'center' },
  last: { ...typography.tiny, color: colors.gold.base, textAlign: 'center' },
});
