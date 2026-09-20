import { makeStyles } from '@lobby/shared/theme';
import type { Profile } from '@lobby/shared/types';
import { Avatar, Card, Text } from '@lobby/shared/ui';
import React from 'react';
import { View } from 'react-native';

import { initialsFromProfile } from '@/lib/format';

/**
 * Tu, in una pastiglia. In home è la prima cosa: identità e sigillo,
 * non la discovery. Il dettaglio sta nel tab Profilo.
 */
export function SelfCard({
  profile,
  sealedVenue,
  onPress,
}: {
  profile: Profile | null;
  sealedVenue: string | null;
  onPress: () => void;
}): React.JSX.Element {
  const styles = useStyles();
  const line = profile?.headline || profile?.occupation || profile?.company;

  return (
    <Card variant="biz" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar initials={initialsFromProfile(profile)} uri={profile?.avatar_url} size={56} />
        <View style={styles.text}>
          <Text variant="name">{profile?.display_name ?? 'Membro'}</Text>
          {line ? (
            <Text variant="small" tone="secondary" numberOfLines={2}>
              {line}
            </Text>
          ) : (
            <Text variant="small" tone="tertiary">
              Completa il profilo per apparire come vuoi tu.
            </Text>
          )}
          <Text variant="tiny" tone="tertiary">
            {sealedVenue
              ? `Sigillo · ${sealedVenue}`
              : 'Nessun sigillo. Lo rilascia il venue, non tu.'}
          </Text>
        </View>
      </View>
      <Text variant="tiny" tone="accent">
        Apri il profilo
      </Text>
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 12 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  text: { flex: 1, minWidth: 0, gap: 3 },
}));
