import type { Match, Profile } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoMatches } from '@/lib/demo';
import { getSupabase, invokeEdgeFunction } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { usePresence } from '@/providers/PresenceProvider';

export type MatchRow = Match & { other: Profile };

export function useMatches(): {
  matches: MatchRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  requestRecompute: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const { presence, isVisible } = usePresence();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setMatches(demoMatches);
      return;
    }
    if (!user || !presence?.room_id) {
      setMatches([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('matches')
        .select('*')
        .eq('room_id', presence.room_id)
        .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
        .order('score', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Match[];
      const otherIds = rows.map((m) =>
        m.profile_a_id === user.id ? m.profile_b_id : m.profile_a_id,
      );
      const { data: profiles } = otherIds.length
        ? await getSupabase().from('profiles').select('*').in('id', otherIds)
        : { data: [] as Profile[] };
      const map = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));
      setMatches(
        rows.flatMap((m) => {
          const otherId =
            m.profile_a_id === user.id ? m.profile_b_id : m.profile_a_id;
          const other = map.get(otherId);
          return other ? [{ ...m, other }] : [];
        }),
      );
    } catch (err) {
      console.warn('useMatches', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, presence?.room_id]);

  const requestRecompute = useCallback(async () => {
    if (isDemo) {
      setMatches(demoMatches);
      return;
    }
    if (!presence?.room_id || !isVisible) return;
    await invokeEdgeFunction<{ room_id: string }, { matches: Match[] }>(
      'compute-matches',
      { room_id: presence.room_id },
    );
    await refresh();
  }, [isDemo, presence?.room_id, isVisible, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { matches, loading, refresh, requestRecompute };
}
