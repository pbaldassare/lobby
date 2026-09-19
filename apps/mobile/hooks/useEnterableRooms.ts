import type { Room, Venue } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type EnterableRoom = Room & {
  venue: Pick<Venue, 'id' | 'name' | 'city'> | null;
};

type RoomRow = Room & {
  venues: Pick<Venue, 'id' | 'name' | 'city'> | Pick<Venue, 'id' | 'name' | 'city'>[] | null;
};

function asVenue(
  raw: RoomRow['venues'],
): Pick<Venue, 'id' | 'name' | 'city'> | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export function useEnterableRooms(): {
  rooms: EnterableRoom[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const [rooms, setRooms] = useState<EnterableRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo || !user) {
      setRooms([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('rooms')
        .select('id, venue_id, name, created_at, opens_at, closes_at, venues(id, name, city)')
        .order('name');
      if (error) throw error;
      setRooms(
        ((data ?? []) as RoomRow[]).map((row) => ({
          ...row,
          venue: asVenue(row.venues),
        })),
      );
    } catch (err) {
      console.warn('useEnterableRooms', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rooms, loading, refresh };
}
