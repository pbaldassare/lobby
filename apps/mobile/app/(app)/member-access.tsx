import { makeStyles } from '@lobby/shared/theme';
import { Card, ListEmpty, ScreenHeader, Text, VerifiedBadge } from '@lobby/shared/ui';
import React from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useMemberAccess, useMemberships } from '@/hooks/useMemberships';

export default function MemberAccessScreen(): React.JSX.Element {
  const styles = useStyles();
  const { memberships } = useMemberships();
  const { access, loading } = useMemberAccess();
  const sealed = memberships.find((m) => m.verified_status === 'verified' && m.seal_issued_at);

  return (
    <Screen>
      <ScreenHeader
        icon="card"
        title="Accessi riservati"
        subtitle="Legati alla tua membership. Li concede il locale, non te li assegni tu."
      />

      {sealed?.venue ? (
        <VerifiedBadge
          venueName={sealed.venue.name}
          venueMark={sealed.venue.name.slice(0, 2)}
          layout="member"
          since={sealed.since}
        />
      ) : (
        <ListEmpty
          icon="card"
          title="Nessun sigillo ancora"
          body="Gli accessi riservati compaiono quando un venue conferma la tua membership."
        />
      )}

      {loading ? <ListEmpty loading title="Carico gli accessi" /> : null}

      {!loading && sealed && access.length === 0 ? (
        <ListEmpty icon="card" title="Nessun accesso registrato" />
      ) : null}

      {access.map((a) => (
        <Card key={a.id} variant="ice" style={styles.card}>
          <Text variant="kicker" tone="accent">
            {a.access_key}
          </Text>
          <Text variant="bodyStrong">{a.label}</Text>
          <View style={styles.expiry}>
            <Text variant="tiny" tone="tertiary">
              {a.expires_at
                ? `Scade il ${new Date(a.expires_at).toLocaleDateString('it-IT')}`
                : 'Senza scadenza'}
            </Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 4 },
  expiry: { marginTop: 2 },
}));
