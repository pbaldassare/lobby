import { makeStyles } from '@lobby/shared/theme';
import { Avatar, Button, Card, Chip, ScreenHeader, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { ProfileProjects } from '@/components/ProfileProjects';
import { Screen } from '@/components/Screen';
import { useDocuments } from '@/hooks/useDocuments';
import { useMemberships } from '@/hooks/useMemberships';
import { initialsFromProfile } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';

function formatSince(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function YourCardScreen(): React.JSX.Element {
  const styles = useStyles();
  const { profile, user } = useAuth();
  const { memberships } = useMemberships();
  const { cv, uploadCv, removeCv, openOwnCv, canUpload } = useDocuments();
  const [cvBusy, setCvBusy] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const sealed = memberships.find((m) => m.verified_status === 'verified' && m.seal_issued_at);

  const runCv = (fn: () => Promise<{ error: string | null }>) => {
    setCvBusy(true);
    setCvError(null);
    void fn().then(({ error }) => {
      setCvBusy(false);
      if (error) setCvError(error);
    });
  };

  return (
    <Screen overTabBar>
      <ScreenHeader
        icon="card"
        title="Profilo"
        subtitle="Identità in Lobby. LinkedIn, CV e progetti alimentano questa card, non la sostituiscono."
      />

      <Card variant="biz" style={styles.block}>
        <View style={styles.blockHead}>
          <Text variant="titleSm">Identità</Text>
          <Chip label="Modifica" onPress={() => router.push('/(app)/edit-profile')} />
        </View>

        <View style={styles.identity}>
          <Avatar initials={initialsFromProfile(profile)} uri={profile?.avatar_url} size={56} />
          <View style={styles.identityText}>
            <Text variant="name">{profile?.display_name ?? 'Membro'}</Text>
            {profile?.headline ? (
              <Text variant="small" tone="secondary" numberOfLines={2}>
                {profile.headline}
              </Text>
            ) : null}
          </View>
        </View>

        <Fact label="Nome" value={profile?.display_name ?? '—'} />
        <Fact label="Email" value={user?.email ?? '—'} hint="L’email non si cambia da qui." />
        <Fact label="Occupazione" value={profile?.occupation ?? '—'} />
        <Fact label="Azienda" value={profile?.company ?? '—'} />
        <Fact
          label="LinkedIn"
          value={profile?.linkedin_url ?? 'Non indicato'}
          hint="Copia nel nostro DB. Non è una scheda live di LinkedIn."
        />
        <Fact
          label="Hobby"
          value={(profile?.hobbies ?? []).length ? (profile?.hobbies ?? []).join(' · ') : '—'}
        />
        <Fact
          label="Sigillo"
          value={sealed?.venue?.name ?? 'Nessun sigillo'}
          hint={
            sealed
              ? 'Rilasciato dal venue, non da te.'
              : 'Chiedilo allo staff. I soci non possono emetterlo da sé.'
          }
        />
        <Fact label="Membro da" value={formatSince(profile?.created_at)} last />
      </Card>

      <Card style={styles.block}>
        <Text variant="titleSm">Curriculum</Text>
        <Text variant="small" tone="secondary">
          Resta sul tuo profilo. Lo vede solo chi è connesso con te.
        </Text>
        {cv ? (
          <Fact label="File" value={cv.file_name} last />
        ) : (
          <Text variant="body" tone="tertiary">
            Nessun file caricato.
          </Text>
        )}
        {cvError ? (
          <Text variant="tiny" tone="danger">
            {cvError}
          </Text>
        ) : null}
        <View style={styles.cvActions}>
          <Button
            label={cv ? 'Sostituisci' : 'Carica CV'}
            loading={cvBusy}
            disabled={!canUpload}
            onPress={() => runCv(uploadCv)}
          />
          {cv ? (
            <>
              <Button label="Apri" variant="ghost" onPress={() => void runCv(openOwnCv)} />
              <Button label="Rimuovi" variant="ghost" onPress={() => runCv(removeCv)} />
            </>
          ) : null}
        </View>
      </Card>

      <Button icon="scan" label="Mostra il QR" onPress={() => router.push('/(app)/qr')} />

      <ProfileProjects />

      <Card style={styles.block}>
        <Text variant="kicker" tone="tertiary">
          In evidenza
        </Text>
        <Text variant="body">{profile?.spotlight || '—'}</Text>
      </Card>

      <Card style={styles.block}>
        <Text variant="kicker" tone="tertiary">
          Offro
        </Text>
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
      </Card>

      <Card style={styles.block}>
        <Text variant="kicker" tone="tertiary">
          Cerco
        </Text>
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
      </Card>

      <Card style={styles.block}>
        <Text variant="titleSm">Privacy</Text>
        <Text variant="small" tone="secondary">
          Invisibile di default. Visibile solo nella stanza in cui sei. Le
          connessioni richiedono il consenso di entrambi. Puoi nasconderti da
          persone o aziende specifiche.
        </Text>
        <Button
          label="Impostazioni"
          variant="ghost"
          onPress={() => router.push('/(app)/settings')}
        />
      </Card>
    </Screen>
  );
}

function Fact({
  label,
  value,
  hint,
  last = false,
}: {
  label: string;
  value: string;
  hint?: string;
  last?: boolean;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={[styles.fact, last && styles.factLast]}>
      <Text variant="tiny" tone="tertiary">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
      {hint ? (
        <Text variant="tiny" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  block: { gap: 12 },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  identityText: { flex: 1, minWidth: 0, gap: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  cvActions: { gap: 8 },
  fact: {
    gap: 3,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.subtle,
  },
  factLast: { borderBottomWidth: 0, paddingBottom: 0 },
}));
