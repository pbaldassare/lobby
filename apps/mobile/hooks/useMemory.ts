import type { Encounter, RoomVisit } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoEncounters, demoRoomVisits } from '@/lib/demo';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export function useMemory(): {
  visits: RoomVisit[];
  encounters: Encounter[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const [visits, setVisits] = useState<RoomVisit[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setVisits(demoRoomVisits);
      setEncounters(demoEncounters);
      return;
    }
    if (!user) {
      setVisits([]);
      setEncounters([]);
      return;
    }
    setLoading(true);
    try {
      const [visitsRes, peopleRes] = await Promise.all([
        getSupabase()
          .from('room_visits')
          .select('*')
          .eq('profile_id', user.id)
          .order('entered_at', { ascending: false })
          .limit(80),
        getSupabase()
          .from('encounters')
          .select('*')
          .eq('visitor_id', user.id)
          .order('seen_at', { ascending: false })
          .limit(120),
      ]);
      if (visitsRes.error) throw visitsRes.error;
      if (peopleRes.error) throw peopleRes.error;
      setVisits((visitsRes.data ?? []) as RoomVisit[]);
      setEncounters((peopleRes.data ?? []) as Encounter[]);
    } catch (err) {
      console.warn('useMemory', err);
      setVisits([]);
      setEncounters([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { visits, encounters, loading, refresh };
}
