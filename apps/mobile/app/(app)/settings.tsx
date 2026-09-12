import { makeStyles, useTheme } from '@lobby/shared/theme';
import { Button, Icon, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { InstallBanner } from '@/components/InstallBanner';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Impostazioni.
 *
 * Accessi riservati, scansione e uscita stavano in fondo alla card come tre
 * bottoni a tutta larghezza, con lo stesso peso visivo della modifica del
 * profilo. Sono cose che si fanno di rado: qui hanno il posto che meritano.
 */
export default function SettingsScreen(): React.JSX.Element {
  const styles = useStyles();
  const { signOut, isDemo } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
      <View style={styles.group}>
        <Row
          label="Accessi riservati"
          hint="Perk legati alla tua membership"
          onPress={() => router.push('/(app)/member-access')}
        />
        <Row
          label="Scansiona un QR"
          hint="Entra in una stanza o apri una card"
          onPress={() => router.push('/(app)/scan')}
        />
      </View>

      <View style={styles.privacy}>
        <Text variant="kicker" tone="tertiary">
          Privacy
        </Text>
        <Text variant="small" tone="secondary">
          Sei invisibile per impostazione predefinita. La visibilità vale solo
          nella stanza in cui sei e si spegne quando esci. Le connessioni
          richiedono il consenso di entrambi.
        </Text>
      </View>

      <InstallBanner />

      <Button
        label="Esci"
        variant="ghost"
        onPress={() => {
          void signOut();
          router.replace('/(auth)/welcome');
        }}
      />

      {isDemo ? (
        <Text variant="tiny" tone="tertiary" style={styles.demo}>
          Modalità dimostrativa · nessun database collegato
        </Text>
      ) : null}
    </ScrollView>
  );
}

function Row({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint: string;
  onPress: () => void;
}): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Text variant="body">{label}</Text>
        <Text variant="tiny" tone="tertiary">
          {hint}
        </Text>
      </View>
      <Icon name="chevronRight" size={18} color={theme.color.text.tertiary} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.color.bg.canvas },
  scroll: { padding: 18, gap: 22 },
  group: {
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
    backgroundColor: t.color.bg.raised,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    minHeight: 56,
  },
  rowText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.6 },
  privacy: { gap: 6 },
  demo: { textAlign: 'center' },
}));
