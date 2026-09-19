import { makeStyles } from '@lobby/shared/theme';
import type { RoomPerson } from '@lobby/shared/types';
import { Button, Card, ListEmpty, ScreenHeader, Segmented, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { PersonRow } from '@/components/PersonRow';
import { PresenceBar } from '@/components/PresenceBar';
import { ProfileSheet } from '@/components/ProfileSheet';
import { RoomEnterList } from '@/components/RoomEnterList';
import { Screen } from '@/components/Screen';
import {
  useEnterableRooms,
  type EnterableRoom,
} from '@/hooks/useEnterableRooms';
import { useMemberships } from '@/hooks/useMemberships';
import { useRoomPeople } from '@/hooks/useRoomPeople';
import { DEMO_ROOM_ID } from '@/lib/demo';
import { useAuth } from '@/providers/AuthProvider';
import { usePresence } from '@/providers/PresenceProvider';

type EnterMode = 'qr' | 'pass';

export default function DiscoverScreen(): React.JSX.Element {
  const { profile, isDemo } = useAuth();
  const { room, isVisible, enterRoom, leaveRoom, setVisible, presence } = usePresence();
  const { people, loading } = useRoomPeople();
  const { memberships } = useMemberships();
  const { rooms } = useEnterableRooms();
  const [selected, setSelected] = useState<RoomPerson | null>(null);

  const roomName = room?.name ?? 'questa stanza';
  const firstName = profile?.display_name?.split(' ')[0];
  const sealed = memberships.find((m) => m.verified_status === 'verified' && m.seal_issued_at);

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
            closesAt={room?.closes_at ?? null}
            count={ranked.length}
            sealedVenue={sealed?.venue?.name ?? null}
            onScan={() => router.push('/(app)/scan')}
            onOther={() => router.push('/(app)/enter')}
            rooms={rooms}
            onDemo={isDemo ? () => void enterRoom(DEMO_ROOM_ID) : undefined}
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
  closesAt,
  count,
  sealedVenue,
  onScan,
  onOther,
  rooms,
  onDemo,
  onLeave,
  onChangeVisibility,
}: {
  firstName?: string;
  roomName: string;
  inRoom: boolean;
  isVisible: boolean;
  closesAt: string | null;
  count: number;
  sealedVenue: string | null;
  onScan: () => void;
  onOther: () => void;
  rooms: EnterableRoom[];
  onDemo?: () => void;
  onLeave: () => void;
  onChangeVisibility: (visible: boolean) => void;
}): React.JSX.Element {
  const styles = useScreenStyles();
  const [enterMode, setEnterMode] = useState<EnterMode>('qr');

  if (!inRoom) {
    return (
      <View style={styles.header}>
        <ScreenHeader
          icon="room"
          title="Stanza"
          subtitle={`Ciao${firstName ? ` ${firstName}` : ''}. Appari solo qui, e solo se lo decidi tu.`}
        />

        <Segmented<EnterMode>
          value={enterMode}
          onChange={setEnterMode}
          options={[
            { value: 'qr', label: 'QR' },
            { value: 'pass', label: 'Pass' },
          ]}
        />

        {enterMode === 'qr' ? (
          <>
            <Button icon="scan" label="Scansiona il QR del locale" onPress={onScan} />
            <RoomEnterList rooms={rooms} />
          </>
        ) : (
          <Button label="Mail, socio, Wi‑Fi" onPress={onOther} />
        )}

        {onDemo ? (
          <Button
            label="Entra nella stanza dimostrativa"
            variant="ghost"
            onPress={onDemo}
          />
        ) : null}

        <Card variant="ice" style={styles.note}>
          <Text variant="bodyStrong">La visibilità è un attimo</Text>
          <Text variant="small" tone="secondary">
            Sei invisibile finché non entri. Vale solo in questa stanza e si spegne
            quando esci. Le connessioni richiedono il consenso di entrambi.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <ScreenHeader
        icon="room"
        kicker={roomName}
        title={isVisible ? 'Chi c’è ora' : 'Sei in stanza'}
        subtitle="Visibile solo qui. Si spegne quando esci."
      />

      <PresenceBar
        isVisible={isVisible}
        roomName={roomName}
        closesAt={closesAt}
        onChange={onChangeVisibility}
        onLeave={onLeave}
      />

      <Card variant="ice" style={styles.hero}>
        <Text variant="titleSm">{isVisible ? 'Visibile' : 'Invisibile'}</Text>
        <Text variant="small" tone="secondary">
          {isVisible
            ? `${count} ${count === 1 ? 'persona' : 'persone'} in questa stanza`
            : 'Nessuno ti vede. Attiva la visibilità per apparire e vedere chi c’è.'}
        </Text>
        <Text variant="tiny" tone="tertiary">
          {sealedVenue
            ? `Sigillo · ${sealedVenue}`
            : 'Nessun sigillo. Lo rilascia il venue, non tu.'}
        </Text>
      </Card>

      <Button
        icon="scan"
        label="Invita scansionando una card"
        variant="ghost"
        onPress={onScan}
      />
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
        icon="scan"
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

const useScreenStyles = makeStyles(() => ({
  header: { gap: 14, paddingBottom: 8 },
  note: { gap: 6 },
  hero: { gap: 6 },
}));

const styles = { list: { paddingBottom: 24 } } as const;
