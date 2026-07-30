import type { Block } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

/** Selective invisibility: hide from people / companies. */
export function useBlocks(): {
  blocks: Block[];
  loading: boolean;
  blockProfile: (profileId: string) => Promise<{ error: string | null }>;
  blockCompany: (company: string) => Promise<{ error: string | null }>;
  unblock: (blockId: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo || !user) {
      setBlocks([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('blocks')
        .select('*')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBlocks((data ?? []) as Block[]);
    } catch (err) {
      console.warn('useBlocks', err);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  const blockProfile = useCallback(
    async (profileId: string) => {
      if (isDemo) return { error: null };
      if (!user) return { error: 'Not signed in' };
      const { error } = await getSupabase().from('blocks').insert({
        blocker_id: user.id,
        blocked_profile_id: profileId,
        blocked_company: null,
      });
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [user, isDemo, refresh],
  );

  const blockCompany = useCallback(
    async (company: string) => {
      if (isDemo) return { error: null };
      if (!user) return { error: 'Not signed in' };
      const { error } = await getSupabase().from('blocks').insert({
        blocker_id: user.id,
        blocked_profile_id: null,
        blocked_company: company.trim(),
      });
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [user, isDemo, refresh],
  );

  const unblock = useCallback(
    async (blockId: string) => {
      if (isDemo) return { error: null };
      if (!user) return { error: 'Not signed in' };
      const { error } = await getSupabase()
        .from('blocks')
        .delete()
        .eq('id', blockId)
        .eq('blocker_id', user.id);
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [user, isDemo, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { blocks, loading, blockProfile, blockCompany, unblock, refresh };
}
