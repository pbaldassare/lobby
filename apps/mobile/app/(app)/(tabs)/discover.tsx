import { makeStyles } from '@lobby/shared/theme';
import type { RoomPerson } from '@lobby/shared/types';
import { ListEmpty, ScreenHeader, Text } from '@lobby/shared/ui';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { PersonRow } from '@/components/PersonRow';
import { PresenceBar } from '@/components/PresenceBar';
import { ProfileSheet } from '@/components/ProfileSheet';
import { Screen } from '@/components/Screen';
import { useRoomPeople } from '@/hooks/useRoomPeople';
import { DEMO_ROOM_ID } from '@/lib/demo';
import { useAuth } from '@/providers/AuthProvider';
import { usePresence } from '@/providers/PresenceProvider';

export default function DiscoverScreen(): React.JSX.Element {
  const { profile } = useAuth();
  const { room, isVisible, enterRoom, leaveRoom, setVisible, presence } = usePresence();
  const { people, loading } = useRoomPeople();
  const [selected, setSelected] = useState<RoomPerson | null>(null);

  const roomName = room?.name ?? 'questa stanza';
  const firstName = profile?.display_name?.split(' ')[0];

  /** Il match migliore in cima: sostituisce la card "Lobby AI", che ripeteva
   *  la prima riga della lista con una grafica diversa. */
  const ranked = useMemo(
    () =>
      [...people].sort(
        (a, b) => Number(b.match?.score ?? 0) - Number(a.match?.score ?? 0),
      ),
    [people],
  );

  const renderItem = useCallback(
    ({ item }: { item: RoomPerson }) => (
      <PersonRow person={item} onPress={() => setSelected(item)} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: RoomPerson) => item.profile.id, []);

  return (
    <Screen scroll={false}>
      <FlatList
        data={isVisible ? ranked : []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Header
            firstName={firstName}
            roomName={roomName}
            inRoom={Boolean(presence)}
            isVisible={isVisible}
            count={ranked.length}
            onEnter={() => void enterRoom(DEMO_ROOM_ID)}
            onLeave={() => void leaveRoom()}
            onChangeVisibility={(v) => void setVisible(v)}
          />
        }
        ListEmptyComponent={
          <Body inRoom={Boolean(presence)} isVisible={isVisible} loading={loading} />
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

function Header({
  firstName,
  roomName,
  inRoom,
  isVisible,
  count,
  onEnter,
  onLeave,
  onChangeVisibility,
}: {
  firstName?: string;
  roomName: string;
  inRoom: boolean;
  isVisible: boolean;
  count: number;
  onEnter: () => void;
  onLeave: () => void;
  onChangeVisibility: (visible: boolean) => void;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={styles.header}>
      <ScreenHeader
        kicker={inRoom ? roomName : undefined}
        title={isVisible && count > 0 ? 'Chi c’è ora' : 'La stanza'}
        subtitle={
          inRoom
            ? undefined
            : `Ciao ${firstName ?? ''}${firstName ? ' — ' : ''}sei invisibile finché non entri in una stanza.`
        }
      />

      {inRoom ? (
        <PresenceBar
          isVisible={isVisible}
          roomName={roomName}
          onChange={onChangeVisibility}
          onLeave={onLeave}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onEnter}
          style={({ pressed }) => [styles.demo, pressed && styles.pressed]}
        >
          <Text variant="tiny" tone="tertiary">
            Entra nella stanza dimostrativa
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function Body({
  inRoom,
  isVisible,
  loading,
}: {
  inRoom: boolean;
  isVisible: boolean;
  loading: boolean;
}): React.JSX.Element {
  if (!inRoom) {
    return (
      <ListEmpty
        icon="card"
        title="Scansiona il QR del locale"
        body="Le stanze si aprono da dentro il venue. Nessuno ti vede finché non lo decidi tu."
      />
    );
  }

  if (!isVisible) {
    return (
      <ListEmpty
        icon="room"
        title="Sei qui, ma nessuno ti vede"
        body="Attiva la visibilità per apparire in questa stanza e vedere chi c'è. I blocchi selettivi restano validi."
      />
    );
  }

  if (loading) {
    return <ListEmpty loading title="Sto guardando chi c'è" />;
  }

  return (
    <ListEmpty
      icon="room"
      title="Per ora sei sola persona visibile"
      body="Chi entra e sceglie di apparire comparirà qui."
    />
  );
}

const useStyles = makeStyles(() => ({
  header: { gap: 14, paddingBottom: 4 },
  demo: { alignSelf: 'flex-start', paddingVertical: 6 },
  pressed: { opacity: 0.6 },
}));

const styles = { list: { paddingBottom: 24 } } as const;
