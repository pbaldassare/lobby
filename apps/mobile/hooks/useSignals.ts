import type { Profile, Signal, SignalStatus } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoSignals } from '@/lib/demo';
import { lobbyUserError } from '@/lib/errors';
import { getSupabase, invokeEdgeFunction } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type SignalRow = Signal & {
  other: Profile | null;
  direction: 'incoming' | 'outgoing';
};

export function useSignals(): {
  signals: SignalRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  sendSignal: (toProfileId: string, message?: string) => Promise<{ error: string | null }>;
  respondToSignal: (
    signalId: string,
    status: Extract<SignalStatus, 'connected' | 'declined'>,
  ) => Promise<{ error: string | null }>;
} {
  const { user, isDemo } = useAuth();
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setSignals(demoSignals as SignalRow[]);
      return;
    }
    if (!user) {
      setSignals([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('signals')
        .select('*')
        .or(`from_profile_id.eq.${user.id},to_profile_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Signal[];
      const otherIds = rows.map((s) =>
        s.from_profile_id === user.id ? s.to_profile_id : s.from_profile_id,
      );
      const { data: profiles } = otherIds.length
        ? await getSupabase().from('profiles').select('*').in('id', otherIds)
        : { data: [] as Profile[] };
      const map = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));
      setSignals(
        rows.map((s) => {
          const otherId =
            s.from_profile_id === user.id ? s.to_profile_id : s.from_profile_id;
          return {
            ...s,
            other: map.get(otherId) ?? null,
            direction:
              s.from_profile_id === user.id
                ? ('outgoing' as const)
                : ('incoming' as const),
          };
        }),
      );
    } catch (err) {
      console.warn('useSignals', err);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  const sendSignal = useCallback(
    async (toProfileId: string, message?: string) => {
      if (isDemo) return { error: 'Modalità dimostrativa: i signal non partono.' };
      const { error } = await invokeEdgeFunction<
        { to_profile_id: string; message?: string | null },
        { signal: Signal }
      >('send-signal', {
        to_profile_id: toProfileId,
        message: message ?? null,
      });
      if (!error) await refresh();
      return { error: lobbyUserError(error?.message) };
    },
    [isDemo, refresh],
  );

  const respondToSignal = useCallback(
    async (
      signalId: string,
      status: Extract<SignalStatus, 'connected' | 'declined'>,
    ) => {
      if (isDemo) return { error: null };
      if (!user) return { error: 'Non hai fatto l’accesso' };
      const { error } = await getSupabase()
        .from('signals')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', signalId)
        .eq('to_profile_id', user.id)
        .eq('status', 'pending');
      if (!error) await refresh();
      return { error: lobbyUserError(error?.message) };
    },
    [user, isDemo, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { signals, loading, refresh, sendSignal, respondToSignal };
}
