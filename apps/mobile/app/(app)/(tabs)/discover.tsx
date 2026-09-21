import { makeStyles } from '@lobby/shared/theme';
import type { Profile, RoomPerson } from '@lobby/shared/types';
import { Button, Card, ListEmpty, ScreenHeader, Text } from '@lobby/shared/ui';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { InstallBanner } from '@/components/InstallBanner';
import { PersonRow } from '@/components/PersonRow';
import { PresenceBar } from '@/components/PresenceBar';
import { ProfileSheet } from '@/components/ProfileSheet';
import { RoomEnterList } from '@/components/RoomEnterList';
import { Screen } from '@/components/Screen';
import { SelfCard } from '@/components/SelfCard';
import {
  useEnterableRooms,
  type EnterableRoom,
} from '@/hooks/useEnterableRooms';
import { useMemberships } from '@/hooks/useMemberships';
import { useRoomPeople } from '@/hooks/useRoomPeople';
import { DEMO_ROOM_ID } from '@/lib/demo';
import { useAuth } from '@/providers/AuthProvider';
import { usePresence } from '@/providers/PresenceProvider';

export default function HomeScreen(): React.JSX.Element {
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
    <Screen scroll={false} overTabBar>
      <FlatList
        data={isVisible ? ranked : []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Header
            profile={profile}
            firstName={firstName}
            roomName={roomName}
            inRoom={Boolean(presence)}
            isVisible={isVisible}
            closesAt={room?.closes_at ?? null}
            count={ranked.length}
            sealedVenue={sealed?.venue?.name ?? null}
            onOpenProfile={() => router.push('/(app)/(tabs)/card')}
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
  profile,
  firstName,
  roomName,
  inRoom,
  isVisible,
  closesAt,
  count,
  sealedVenue,
  onOpenProfile,
  onScan,
  onOther,
  rooms,
  onDemo,
  onLeave,
  onChangeVisibility,
}: {
  profile: Profile | null;
  firstName?: string;
  roomName: string;
  inRoom: boolean;
  isVisible: boolean;
  closesAt: string | null;
  count: number;
  sealedVenue: string | null;
  onOpenProfile: () => void;
  onScan: () => void;
  onOther: () => void;
  rooms: EnterableRoom[];
  onDemo?: () => void;
  onLeave: () => void;
  onChangeVisibility: (visible: boolean) => void;
}): React.JSX.Element {
  const styles = useScreenStyles();

  if (!inRoom) {
    return (
      <View style={styles.header}>
        <ScreenHeader
          icon="room"
          title={firstName ? `Ciao, ${firstName}` : 'Home'}
          subtitle="Il tuo profilo, poi una stanza. Appari solo se lo decidi tu."
        />

        <SelfCard profile={profile} sealedVenue={sealedVenue} onPress={onOpenProfile} />

        <InstallBanner />

        <View style={styles.enter}>
          <Text variant="titleSm">Entra in una stanza</Text>
          <Text variant="small" tone="secondary">
            QR all’ingresso, una stanza già permessa, o mail / socio / Wi‑Fi.
            Resti invisibile finché non attivi la visibilità.
          </Text>
          <Button icon="scan" label="Scansiona il QR del locale" onPress={onScan} />
          <RoomEnterList rooms={rooms} />
          <Button label="Mail, socio, Wi‑Fi" variant="ghost" onPress={onOther} />
          {onDemo ? (
            <Button
              label="Entra nella stanza dimostrativa"
              variant="ghost"
              onPress={onDemo}
            />
          ) : null}
        </View>
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

      <SelfCard profile={profile} sealedVenue={sealedVenue} onPress={onOpenProfile} />

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
      </Card>

      <Button
        icon="scan"
        label="Invita scansionando una card"
        variant="ghost"
        onPress={onScan}
      />

      <InstallBanner />
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
}): React.JSX.Element | null {
  if (!inRoom) return null;

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
  enter: { gap: 12 },
  hero: { gap: 6 },
}));

const styles = { list: { paddingBottom: 24 } } as const;
