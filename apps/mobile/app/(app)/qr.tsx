import { makeStyles } from '@lobby/shared/theme';
import { Button, Text, VerifiedBadge } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { QrCard } from '@/components/QrCard';
import { useMemberships } from '@/hooks/useMemberships';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Presentare la propria card.
 *
 * Dentro il locale il gesto è passare il telefono a qualcuno: deve esserci
 * solo quello che serve a farsi riconoscere — nome, sigillo, codice — e niente
 * altro da scorrere. Per questo è una rotta a sé e non un pezzo della card.
 */
export default function QrScreen(): React.JSX.Element {
  const styles = useStyles();
  const { profile, isDemo } = useAuth();
  const { memberships } = useMemberships();
  const sealed = memberships.find((m) => m.verified_status === 'verified' && m.seal_issued_at);

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text variant="titleSm" style={styles.center}>
          {profile?.display_name ?? 'Membro'}
        </Text>
        {profile?.headline ? (
          <Text variant="small" tone="secondary" style={styles.center}>
            {profile.headline}
          </Text>
        ) : null}

        <QrCard value={`lobby://member/${profile?.id ?? 'unknown'}`} size={210} />

        {sealed?.venue ? (
          <VerifiedBadge
            venueName={sealed.venue.name}
            venueMark={sealed.venue.name.slice(0, 2)}
            style={styles.badge}
          />
        ) : null}

        <Text variant="tiny" tone="tertiary" style={styles.center}>
          Inquadralo per aprire questa card · {isDemo ? 'dimostrativo' : 'reale'}
        </Text>
      </View>

      <Button label="Chiudi" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: {
    flex: 1,
    backgroundColor: t.color.bg.canvas,
    justifyContent: 'center',
    padding: 18,
    gap: 20,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.border.strong,
    backgroundColor: t.color.bg.raised,
  },
  center: { textAlign: 'center' },
  badge: { alignSelf: 'center' },
}));
