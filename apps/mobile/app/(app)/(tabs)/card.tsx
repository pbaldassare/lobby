import { makeStyles, useTheme } from '@lobby/shared/theme';
import { Avatar, Button, Card, Chip, Icon, ScreenHeader, Text, VerifiedBadge } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useMemberships } from '@/hooks/useMemberships';
import { initialsFromProfile } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';

/**
 * La propria card.
 *
 * Prima questa schermata teneva insieme identità, QR, tre blocchi in lettura,
 * un form di modifica che compariva inline, e in fondo accessi, scansione e
 * uscita. Cose diverse con tempi diversi, in un unico scorrimento.
 *
 * Ora resta l'identità. Il QR è un gesto a sé — dentro il locale passi il
 * telefono a qualcuno, non gli fai scorrere il tuo profilo — e modifica e
 * impostazioni hanno una loro rotta.
 */
export default function YourCardScreen(): React.JSX.Element {
  const styles = useStyles();
  const { profile } = useAuth();
  const { memberships } = useMemberships();
  const sealed = memberships.find((m) => m.verified_status === 'verified' && m.seal_issued_at);

  return (
    <Screen>
      <ScreenHeader
        title="La tua card"
        subtitle="Identità e sigillo del venue. Il sigillo lo rilascia il locale: non te lo puoi dare da solo."
      />

      <Card variant="biz" style={styles.biz}>
        <View style={styles.identity}>
          <Avatar initials={initialsFromProfile(profile)} uri={profile?.avatar_url} size={60} />
          <View style={styles.identityText}>
            <Text variant="titleSm" numberOfLines={1}>
              {profile?.display_name ?? 'Membro'}
            </Text>
            {profile?.headline ? (
              <Text variant="small" tone="secondary" numberOfLines={2}>
                {profile.headline}
              </Text>
            ) : null}
            {profile?.company ? (
              <Text variant="tiny" tone="accent" numberOfLines={1}>
                {profile.company}
              </Text>
            ) : null}
          </View>
        </View>

        {sealed?.venue ? (
          <VerifiedBadge
            venueName={sealed.venue.name}
            venueMark={sealed.venue.name.slice(0, 2)}
            layout="member"
            since={sealed.since}
          />
        ) : (
          <Text variant="small" tone="tertiary">
            Nessun sigillo. Chiedilo allo staff del venue: i soci non possono emetterlo da sé.
          </Text>
        )}
      </Card>

      <Button label="Mostra il QR" onPress={() => router.push('/(app)/qr')} />

      <Block label="In evidenza">
        <Text variant="body">{profile?.spotlight || '—'}</Text>
      </Block>

      <Block label="Offro">
        {(profile?.offer ?? []).length === 0 ? (
          <Text variant="body" tone="tertiary">
            —
          </Text>
        ) : (
          <View style={styles.chips}>
            {(profile?.offer ?? []).map((t) => (
              <Chip key={t} label={t} />
            ))}
          </View>
        )}
      </Block>

      <Block label="Cerco">
        {(profile?.seek ?? []).length === 0 ? (
          <Text variant="body" tone="tertiary">
            —
          </Text>
        ) : (
          <View style={styles.chips}>
            {(profile?.seek ?? []).map((t) => (
              <Chip key={t} label={t} variant="match" />
            ))}
          </View>
        )}
      </Block>

      <View style={styles.links}>
        <LinkRow label="Modifica profilo" onPress={() => router.push('/(app)/edit-profile')} />
        <LinkRow label="Impostazioni" onPress={() => router.push('/(app)/settings')} />
      </View>
    </Screen>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={styles.block}>
      <Text variant="kicker" tone="tertiary">
        {label}
      </Text>
      {children}
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
    >
      <Text variant="body">{label}</Text>
      <Icon name="chevronRight" size={18} color={theme.color.text.tertiary} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  biz: { gap: 14 },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  identityText: { flex: 1, minWidth: 0, gap: 3 },
  block: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  links: { marginTop: 4 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: t.color.border.subtle,
    minHeight: 48,
  },
  pressed: { opacity: 0.6 },
}));
