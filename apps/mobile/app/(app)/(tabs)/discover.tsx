import type { RoomPerson } from '@lobby/shared/types';
import { colors, space, typography } from '@lobby/shared/tokens';
import { Button } from '@lobby/shared/ui';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LobbyAiCard } from '@/components/LobbyAiCard';
import { PersonRow } from '@/components/PersonRow';
import { ProfileSheet } from '@/components/ProfileSheet';
import { Screen } from '@/components/Screen';
import { VisibilityToggle } from '@/components/VisibilityToggle';
import { useMatches } from '@/hooks/useMatches';
import { useRoomPeople } from '@/hooks/useRoomPeople';
import { DEMO_ROOM_ID } from '@/lib/demo';
import { useAuth } from '@/providers/AuthProvider';
import { usePresence } from '@/providers/PresenceProvider';

export default function DiscoverScreen(): React.JSX.Element {
  const { profile } = useAuth();
  const { room, isVisible, enterRoom, leaveRoom, setVisible, presence } = usePresence();
  const { people, loading } = useRoomPeople();
  const { matches } = useMatches();
  const [selected, setSelected] = useState<RoomPerson | null>(null);

  const roomMatches = useMemo(
    () => matches.filter((m) => !room?.id || m.room_id === room.id || m.room_id == null),
    [matches, room?.id],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>{room?.name ?? 'No room'}</Text>
        <Text style={styles.title}>The room</Text>
        <Text style={styles.sub}>
          Hi {profile?.display_name?.split(' ')[0] ?? 'there'} — invisible by default. Opt in to
          appear only here.
        </Text>
      </View>

      {!presence ? (
        <Button label="Enter demo room" onPress={() => void enterRoom(DEMO_ROOM_ID)} />
      ) : (
        <>
          <VisibilityToggle isVisible={isVisible} onChange={(v) => void setVisible(v)} />
          <Button label="Leave room" variant="ghost" onPress={() => void leaveRoom()} />
        </>
      )}

      <LobbyAiCard
        topMatches={isVisible ? roomMatches : []}
        onOpen={(m) => {
          const person = people.find((p) => p.profile.id === m.other.id);
          setSelected(
            person ?? {
              profile: m.other,
              presence: {
                id: 'tmp',
                profile_id: m.other.id,
                room_id: room?.id ?? DEMO_ROOM_ID,
                is_visible: true,
                visible_until: null,
                last_heartbeat: new Date().toISOString(),
                entered_at: new Date().toISOString(),
              },
              match: { id: m.id, score: m.score, reasons: m.reasons },
            },
          );
        }}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>In the room</Text>
        {!isVisible ? (
          <Text style={styles.hint}>
            Turn visibility on to see who opted in. Selective blocks still apply.
          </Text>
        ) : loading ? (
          <Text style={styles.hint}>Loading…</Text>
        ) : people.length === 0 ? (
          <Text style={styles.hint}>No one else is visible right now.</Text>
        ) : (
          people.map((p) => (
            <PersonRow key={p.profile.id} person={p} onPress={() => setSelected(p)} />
          ))
        )}
      </View>

      <ProfileSheet
        person={selected}
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.md },
  kicker: { ...typography.kicker, color: colors.gold.base },
  title: { ...typography.displayLg, color: colors.ink.primary },
  sub: { ...typography.sm, color: colors.ink.muted },
  section: { gap: space.md },
  sectionTitle: { ...typography.displaySm, color: colors.ink.primary },
  hint: { ...typography.sm, color: colors.ink.muted2 },
});
