import { makeStyles, useTheme } from '@lobby/shared/theme';
import type { RoomPerson } from '@lobby/shared/types';
import { ListEmpty, ScreenHeader } from '@lobby/shared/ui';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { PersonRow } from '@/components/PersonRow';
import { ProfileSheet } from '@/components/ProfileSheet';
import { Screen } from '@/components/Screen';
import { useMatches, type MatchRow } from '@/hooks/useMatches';
import { DEMO_ROOM_ID } from '@/lib/demo';

/** Da `MatchRow` alla forma che `PersonRow` sa disegnare. */
function toPerson(m: MatchRow): RoomPerson {
  return {
    profile: m.other,
    presence: {
      id: 'match',
      profile_id: m.other.id,
      room_id: m.room_id ?? DEMO_ROOM_ID,
      is_visible: true,
      visible_until: null,
      last_heartbeat: new Date().toISOString(),
      entered_at: new Date().toISOString(),
    },
    match: { id: m.id, score: m.score, reasons: m.reasons },
  };
}

export default function MatchesScreen(): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const { matches, loading, requestRecompute } = useMatches();
  const [selected, setSelected] = useState<RoomPerson | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /** Prima era `Card` + avatar + chip riscritti a mano, una copia di
   *  `PersonRow` con qualche pixel di differenza. Ora è lo stesso componente. */
  const people = useMemo(() => matches.map(toPerson), [matches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void requestRecompute().finally(() => setRefreshing(false));
  }, [requestRecompute]);

  const renderItem = useCallback(
    ({ item }: { item: RoomPerson }) => (
      <PersonRow person={item} onPress={() => setSelected(item)} />
    ),
    [],
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={people}
        renderItem={renderItem}
        keyExtractor={(p) => p.profile.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        /** Al posto di un bottone "Refresh" a tutta larghezza: il gesto che
         *  la gente si aspetta già da una lista. */
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.color.accent.default}
            colors={[theme.color.accent.default]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              icon="matches"
              title="Match"
              subtitle="Costruite su cosa offri, cosa cerchi e cosa stai facendo. Non è un elenco pubblico."
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ListEmpty loading title="Sto calcolando" />
          ) : (
            <ListEmpty
              icon="matches"
              title="Ancora nessun match"
              body="Renditi visibile in una stanza e tieni aggiornato cosa offri e cosa cerchi. La connessione resta solo per consenso reciproco."
            />
          )
        }
      />

      <ProfileSheet
        person={selected}
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  header: { paddingBottom: 4 },
  list: { paddingBottom: 24 },
}));
