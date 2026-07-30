import { colors, space, typography } from '@lobby/shared/tokens';
import { Avatar, Button, Card, Chip, VerifiedBadge } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { QrCard } from '@/components/QrCard';
import { Screen } from '@/components/Screen';
import { useMemberships } from '@/hooks/useMemberships';
import { initialsFromProfile } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';

export default function YourCardScreen(): React.JSX.Element {
  const { profile, updateProfile, signOut, isDemo } = useAuth();
  const { memberships } = useMemberships();
  const sealed = memberships.find((m) => m.verified_status === 'verified' && m.seal_issued_at);
  const [editing, setEditing] = useState(false);
  const [spotlight, setSpotlight] = useState(profile?.spotlight ?? '');
  const [offer, setOffer] = useState((profile?.offer ?? []).join(', '));
  const [seek, setSeek] = useState((profile?.seek ?? []).join(', '));
  const [status, setStatus] = useState<string | null>(null);
  const qrValue = `lobby://member/${profile?.id ?? 'unknown'}`;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Your card</Text>
        <Text style={styles.sub}>
          Identity + venue seal. Seal is issued by the venue — never self-claimed.
        </Text>
      </View>
      <Card variant="biz" style={styles.biz}>
        <View style={styles.identity}>
          <Avatar initials={initialsFromProfile(profile)} uri={profile?.avatar_url} size={64} />
          <View style={styles.identityText}>
            <Text style={styles.name}>{profile?.display_name ?? 'Member'}</Text>
            {profile?.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
            {profile?.company ? <Text style={styles.company}>{profile.company}</Text> : null}
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
          <Text style={styles.noSeal}>
            No seal yet. Ask venue staff — members cannot issue their own.
          </Text>
        )}
        <QrCard value={qrValue} />
        <Text style={styles.qrHint}>Scan to open this card · {isDemo ? 'demo' : 'live'}</Text>
      </Card>

      {!editing ? (
        <>
          <View style={styles.block}>
            <Text style={styles.label}>Spotlight</Text>
            <Text style={styles.body}>{profile?.spotlight || '—'}</Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Offer</Text>
            <View style={styles.chips}>
              {(profile?.offer ?? []).map((t) => (
                <Chip key={t} label={t} />
              ))}
            </View>
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Seek</Text>
            <View style={styles.chips}>
              {(profile?.seek ?? []).map((t) => (
                <Chip key={t} label={t} variant="match" />
              ))}
            </View>
          </View>
          <Button label="Edit profile" onPress={() => setEditing(true)} />
        </>
      ) : (
        <Card style={styles.edit}>
          <Text style={styles.label}>Spotlight</Text>
          <TextInput
            style={styles.input}
            value={spotlight}
            onChangeText={setSpotlight}
            placeholderTextColor={colors.ink.muted2}
            placeholder="What you're building now"
            multiline
          />
          <Text style={styles.label}>Offer (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={offer}
            onChangeText={setOffer}
            placeholderTextColor={colors.ink.muted2}
          />
          <Text style={styles.label}>Seek (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={seek}
            onChangeText={setSeek}
            placeholderTextColor={colors.ink.muted2}
          />
          <Button
            label="Save"
            onPress={() => {
              void updateProfile({
                spotlight: spotlight.trim() || null,
                offer: offer
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
                seek: seek
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              }).then(({ error }) => {
                setStatus(error ?? 'Saved');
                if (!error) setEditing(false);
              });
            }}
          />
          <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
        </Card>
      )}

      <Button label="Member access" variant="ghost" onPress={() => router.push('/(app)/member-access')} />
      <Button label="Scan QR" variant="ghost" onPress={() => router.push('/(app)/scan')} />
      <Button
        label="Sign out"
        variant="ghost"
        onPress={() => {
          void signOut();
          router.replace('/(auth)/welcome');
        }}
      />
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.md },
  title: { ...typography.displayLg, color: colors.ink.primary },
  sub: { ...typography.sm, color: colors.ink.muted },
  biz: { gap: space.lg },
  identity: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  identityText: { flex: 1, gap: 4 },
  name: { ...typography.displayMd, color: colors.ink.primary },
  headline: { ...typography.sm, color: colors.ink.muted },
  company: { ...typography.tiny, color: colors.gold.base },
  noSeal: { ...typography.sm, color: colors.ink.muted2 },
  qrHint: { ...typography.tiny, color: colors.ink.muted2, textAlign: 'center' },
  block: { gap: space.sm },
  label: { ...typography.kicker, color: colors.ink.muted2 },
  body: { ...typography.body, color: colors.ink.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.chipGap },
  edit: { gap: space.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    borderRadius: 11,
    padding: space.md,
    color: colors.ink.primary,
    ...typography.body,
  },
  status: { ...typography.sm, color: colors.ink.muted },
});
