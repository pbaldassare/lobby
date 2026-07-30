import type { Match, Membership, Presence, Profile, RoomPerson, Venue } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoRoomPeople } from '@/lib/demo';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { usePresence } from '@/providers/PresenceProvider';

type PresenceRow = Presence & { profiles: Profile | null };

export function useRoomPeople(): {
  people: RoomPerson[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const { presence, isVisible } = usePresence();
  const [people, setPeople] = useState<RoomPerson[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setPeople(isVisible ? demoRoomPeople : []);
      return;
    }
    if (!user || !presence?.room_id || !isVisible) {
      setPeople([]);
      return;
    }

    setLoading(true);
    try {
      const roomId = presence.room_id;
      const { data: rows, error } = await getSupabase()
        .from('presence')
        .select('*, profiles(*)')
        .eq('room_id', roomId)
        .eq('is_visible', true)
        .neq('profile_id', user.id);
      if (error) throw error;

      const list = (rows ?? []) as PresenceRow[];
      const profileIds = list.map((r) => r.profile_id);
      if (profileIds.length === 0) {
        setPeople([]);
        return;
      }

      const [matchesRes, membershipsRes] = await Promise.all([
        getSupabase()
          .from('matches')
          .select('*')
          .eq('room_id', roomId)
          .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`),
        getSupabase()
          .from('memberships')
          .select('*, venues(*)')
          .in('profile_id', profileIds)
          .eq('verified_status', 'verified'),
      ]);

      const matches = (matchesRes.data ?? []) as Match[];
      const memberships = (membershipsRes.data ?? []) as Array<
        Membership & { venues: Venue | Venue[] | null }
      >;

      setPeople(
        list
          .filter((r) => r.profiles)
          .map((r) => {
            const profile = r.profiles as Profile;
            const match = matches.find(
              (m) =>
                (m.profile_a_id === user.id && m.profile_b_id === profile.id) ||
                (m.profile_b_id === user.id && m.profile_a_id === profile.id),
            );
            const mem = memberships.find((m) => m.profile_id === profile.id);
            const venue = mem
              ? Array.isArray(mem.venues)
                ? (mem.venues[0] ?? null)
                : mem.venues
              : null;
            return {
              profile,
              presence: r,
              match: match
                ? { id: match.id, score: match.score, reasons: match.reasons }
                : null,
              membership: mem ? { ...mem, venue } : null,
            };
          })
          .sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0)),
      );
    } catch (err) {
      console.warn('useRoomPeople', err);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, presence?.room_id, isVisible]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (isDemo || !presence?.room_id || !isVisible) return;
    const channel = getSupabase()
      .channel(`room-presence:${presence.room_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `room_id=eq.${presence.room_id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void getSupabase().removeChannel(channel);
    };
  }, [isDemo, presence?.room_id, isVisible, refresh]);

  return { people, loading, refresh };
}
