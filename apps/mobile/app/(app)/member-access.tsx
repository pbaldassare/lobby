import { colors, space, typography } from '@lobby/shared/tokens';
import { Card, VerifiedBadge } from '@lobby/shared/ui';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useMemberAccess, useMemberships } from '@/hooks/useMemberships';

export default function MemberAccessScreen(): React.JSX.Element {
  const { memberships } = useMemberships();
  const { access, loading } = useMemberAccess();
  const sealed = memberships.find((m) => m.verified_status === 'verified' && m.seal_issued_at);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Member access</Text>
        <Text style={styles.sub}>
          Reserved perks tied to your venue membership — issued by the club, not self-asserted.
        </Text>
      </View>
      {sealed?.venue ? (
        <VerifiedBadge
          venueName={sealed.venue.name}
          venueMark={sealed.venue.name.slice(0, 2)}
          layout="member"
          since={sealed.since}
        />
      ) : (
        <Text style={styles.hint}>No verified membership with a seal yet.</Text>
      )}
      {loading ? <Text style={styles.hint}>Loading…</Text> : null}
      {access.length === 0 && !loading ? (
        <Text style={styles.hint}>No reserved accesses on file.</Text>
      ) : null}
      {access.map((a) => (
        <Card key={a.id} variant="ice">
          <Text style={styles.label}>{a.access_key}</Text>
          <Text style={styles.item}>{a.label}</Text>
          <Text style={styles.hint}>
            {a.expires_at ? `Expires ${new Date(a.expires_at).toLocaleDateString()}` : 'No expiry'}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.md },
  title: { ...typography.displayLg, color: colors.ink.primary },
  sub: { ...typography.sm, color: colors.ink.muted },
  hint: { ...typography.sm, color: colors.ink.muted2 },
  label: { ...typography.kicker, color: colors.gold.base },
  item: { ...typography.bodyStrong, color: colors.ink.primary, marginTop: space.xs },
});
