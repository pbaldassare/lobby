import type { MemberAccess, Membership, Venue } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoAccess, demoMembership } from '@/lib/demo';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type MembershipWithVenue = Membership & { venue: Venue | null };

export function useMemberships(): {
  memberships: MembershipWithVenue[];
  accesses: MemberAccess[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const [memberships, setMemberships] = useState<MembershipWithVenue[]>([]);
  const [accesses, setAccesses] = useState<MemberAccess[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setMemberships([demoMembership]);
      setAccesses(demoAccess);
      return;
    }
    if (!user) {
      setMemberships([]);
      setAccesses([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('memberships')
        .select('*, venues(*)')
        .eq('profile_id', user.id);
      if (error) throw error;
      const list = (
        (data ?? []) as Array<
          Membership & { venues: Venue | Venue[] | null }
        >
      ).map((m) => ({
        ...m,
        venue: Array.isArray(m.venues) ? (m.venues[0] ?? null) : (m.venues ?? null),
      }));
      setMemberships(list);

      const sealedIds = list
        .filter((m) => m.seal_issued_at && m.verified_status === 'verified')
        .map((m) => m.id);
      if (sealedIds.length) {
        const { data: accessRows } = await getSupabase()
          .from('member_access')
          .select('*')
          .in('membership_id', sealedIds)
          .order('granted_at', { ascending: false });
        setAccesses((accessRows ?? []) as MemberAccess[]);
      } else {
        setAccesses([]);
      }
    } catch (err) {
      console.warn('useMemberships', err);
      setMemberships([]);
      setAccesses([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { memberships, accesses, loading, refresh };
}

/** Alias used by member-access screen. */
export function useMemberAccess(): {
  access: MemberAccess[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { accesses, loading, refresh } = useMemberships();
  return { access: accesses, loading, refresh };
}
