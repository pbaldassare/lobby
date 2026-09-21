import { makeStyles } from '@lobby/shared/theme';
import type { Encounter, RoomVisit } from '@lobby/shared/types';
import { Card, ListEmpty, ScreenHeader, Segmented, Text } from '@lobby/shared/ui';
import React, { useMemo, useState } from 'react';

import { Screen } from '@/components/Screen';
import { useMemory } from '@/hooks/useMemory';

type MemoryTab = 'rooms' | 'people';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function visitRange(visit: RoomVisit): string {
  const start = formatWhen(visit.entered_at);
  if (!visit.left_at) return `${start} · ancora qui`;
  return `${start} → ${formatWhen(visit.left_at)}`;
}

/** Storico privato: snapshot, non presence live. */
export default function MemoryScreen(): React.JSX.Element {
  const { visits, encounters, loading } = useMemory();
  const [tab, setTab] = useState<MemoryTab>('rooms');

  const visitById = useMemo(() => {
    const map = new Map<string, RoomVisit>();
    for (const v of visits) map.set(v.id, v);
    return map;
  }, [visits]);

  return (
    <Screen overTabBar>
      <ScreenHeader
        icon="memory"
        title="Storico"
        subtitle="Solo tu. Snapshot di stanze e persone viste — spariscono dalla stanza, restano qui."
      />

      <Segmented
        options={[
          { value: 'rooms', label: 'Stanze', badge: visits.length || undefined },
          { value: 'people', label: 'Persone', badge: encounters.length || undefined },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? <ListEmpty loading title="Carico la memoria" /> : null}

      {!loading && tab === 'rooms' && visits.length === 0 ? (
        <ListEmpty
          icon="memory"
          title="Nessuna stanza ancora"
          body="Quando esci da una stanza, la visita resta qui. Non è visibile a nessuno."
        />
      ) : null}

      {!loading && tab === 'people' && encounters.length === 0 ? (
        <ListEmpty
          icon="room"
          title="Nessuno in memoria"
          body="Si salvano solo le persone visibili nella stessa stanza, escluse quelle da cui ti nascondi."
        />
      ) : null}

      {tab === 'rooms'
        ? visits.map((v) => <VisitCard key={v.id} visit={v} />)
        : encounters.map((e) => (
            <EncounterCard key={e.id} encounter={e} visit={visitById.get(e.room_visit_id)} />
          ))}
    </Screen>
  );
}

function VisitCard({ visit }: { visit: RoomVisit }): React.JSX.Element {
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <Text variant="kicker" tone="accent">
        {visit.venue_name ?? 'Venue'}
      </Text>
      <Text variant="titleSm">{visit.room_name}</Text>
      <Text variant="small" tone="secondary">
        {visitRange(visit)}
      </Text>
    </Card>
  );
}

function EncounterCard({
  encounter,
  visit,
}: {
  encounter: Encounter;
  visit?: RoomVisit;
}): React.JSX.Element {
  const styles = useStyles();
  return (
    <Card style={styles.card}>
      <Text variant="name">{encounter.snapshot_name ?? 'Membro'}</Text>
      {encounter.snapshot_headline || encounter.snapshot_occupation ? (
        <Text variant="small" tone="secondary">
          {[encounter.snapshot_occupation, encounter.snapshot_headline]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
      {encounter.snapshot_company ? (
        <Text variant="tiny" tone="tertiary">
          {encounter.snapshot_company}
        </Text>
      ) : null}
      <Text variant="tiny" tone="tertiary">
        {visit
          ? `${visit.room_name}${visit.venue_name ? ` · ${visit.venue_name}` : ''} · ${formatWhen(encounter.seen_at)}`
          : formatWhen(encounter.seen_at)}
      </Text>
      <Text variant="tiny" tone="tertiary">
        Snapshot di allora — non è il profilo di adesso.
      </Text>
    </Card>
  );
}

const useStyles = makeStyles(() => ({
  card: { gap: 4 },
}));
