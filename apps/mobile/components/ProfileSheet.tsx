import { makeStyles } from '@lobby/shared/theme';
import type { RoomPerson } from '@lobby/shared/types';
import {
  Avatar,
  BottomSheet,
  Button,
  Chip,
  MatchScore,
  Text,
  VerifiedBadge,
} from '@lobby/shared/ui';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useBlocks } from '@/hooks/useBlocks';
import { useSignals } from '@/hooks/useSignals';
import { initialsFromProfile, scoreToPercent, suggestedOpener } from '@/lib/format';

export function ProfileSheet({
  person,
  visible,
  onClose,
}: {
  person: RoomPerson | null;
  visible: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const styles = useStyles();
  const { sendSignal } = useSignals();
  const { blockProfile, blockCompany } = useBlocks();
  const [busy, setBusy] = useState(false);
  /** Esito in pagina e non in un `Alert`: sul web `Alert.alert` non mostra
   *  nulla, e il pulsante sembrava non fare niente. */
  const [outcome, setOutcome] = useState<{ sent: boolean; text: string } | null>(null);
  const personId = person?.profile.id;

  useEffect(() => setOutcome(null), [personId, visible]);

  const opener = useMemo(
    () => (person ? suggestedOpener(person.match?.reasons ?? [], person.profile.seek) : ''),
    [person],
  );

  if (!person) return null;

  const { profile, match, membership } = person;
  const venueName = membership?.venue?.name;
  const scorePct = match ? scoreToPercent(Number(match.score)) : null;
  const sealed = Boolean(membership?.seal_issued_at);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Avatar initials={initialsFromProfile(profile)} uri={profile.avatar_url} size={64} />
        <View style={styles.headerText}>
          <Text variant="titleSm">{profile.display_name ?? 'Membro'}</Text>
          <Text variant="small" tone="secondary">
            {profile.headline ?? profile.company ?? 'Membro'}
          </Text>
          {scorePct != null ? (
            <View style={styles.scoreRow}>
              <Text variant="tiny" tone="tertiary">
                Affinità
              </Text>
              <MatchScore score={scorePct} size="md" />
            </View>
          ) : null}
        </View>
      </View>

      {sealed && venueName ? (
        <VerifiedBadge
          venueName={venueName}
          layout="member"
          since={membership?.since ?? null}
          style={styles.badge}
        />
      ) : (
        <Text variant="small" tone="secondary" style={styles.badge}>
          Il sigillo lo rilascia il venue — non te lo puoi dare da solo.
        </Text>
      )}

      {profile.spotlight ? (
        <Section title="In evidenza">
          <Text variant="body">{profile.spotlight}</Text>
        </Section>
      ) : null}

      {profile.offer.length > 0 ? (
        <Section title="Offre">
          <View style={styles.chips}>
            {profile.offer.map((t) => (
              <Chip key={t} label={t} />
            ))}
          </View>
        </Section>
      ) : null}

      {profile.seek.length > 0 ? (
        <Section title="Cerca">
          <View style={styles.chips}>
            {profile.seek.map((t) => (
              <Chip key={t} label={t} variant="match" />
            ))}
          </View>
        </Section>
      ) : null}

      {match?.reasons?.length ? (
        <Section title="Perché vi siete incrociati">
          {match.reasons.map((r) => (
            <Text key={r} variant="body">
              · {r}
            </Text>
          ))}
        </Section>
      ) : null}

      <Section title="Come rompere il ghiaccio">
        <Text variant="body">{opener}</Text>
      </Section>

      <View style={styles.actions}>
        <Button
          label={outcome?.sent ? 'Signal inviato' : 'Manda un signal'}
          loading={busy}
          disabled={outcome?.sent}
          onPress={() => {
            setBusy(true);
            setOutcome(null);
            void sendSignal(profile.id, opener).then(({ error }) => {
              setBusy(false);
              setOutcome(
                error
                  ? { sent: false, text: `Signal non inviato. ${error}` }
                  : {
                      sent: true,
                      text: 'La chat si apre solo se accetta: serve il consenso di entrambi.',
                    },
              );
            });
          }}
        />
        {outcome ? (
          <Text
            variant="small"
            tone={outcome.sent ? 'secondary' : 'danger'}
            accessibilityLiveRegion="polite"
            style={styles.outcome}
          >
            {outcome.text}
          </Text>
        ) : null}
        <Button
          label="Nascondimi a questa persona"
          variant="ghost"
          onPress={() => void blockProfile(profile.id).then(onClose)}
        />
        {profile.company ? (
          <Button
            label={`Nascondimi a ${profile.company}`}
            variant="ghost"
            onPress={() => void blockCompany(profile.company!).then(onClose)}
          />
        ) : null}
        <Text variant="tiny" tone="tertiary" style={styles.privacy}>
          Le presentazioni passano da un contatto in comune. La chat si apre solo
          a connessione reciproca.
        </Text>
      </View>
    </BottomSheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <Text variant="kicker" tone="accent">
        {title}
      </Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  header: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  headerText: { flex: 1, gap: 4, justifyContent: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: { marginBottom: 6 },
  section: { marginTop: 18, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  actions: { marginTop: 24, gap: 8 },
  outcome: { textAlign: 'center' },
  privacy: { marginTop: 8 },
}));
