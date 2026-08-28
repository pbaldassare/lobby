import type { Intro, Profile } from '@lobby/shared/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { demoIntros } from '@/lib/demo';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type IntroRow = Intro & {
  /** Le due persone messe in contatto e chi le ha presentate. */
  a: Profile | null;
  b: Profile | null;
  introducer: Profile | null;
  /** Da che parte lo guardi: l'hai fatta tu o l'hai ricevuta. */
  direction: 'made' | 'received';
};

/**
 * Le presentazioni.
 *
 * La tabella `intros` esiste dall'inizio, ha le sue policy, ed è persino
 * conteggiata nelle statistiche del back-office. Nell'app non c'era una sola
 * schermata: una funzione progettata fino al database e mai fatta emergere.
 *
 * Nel networking la presentazione tramite un contatto in comune è il
 * meccanismo più forte che esista — vale più di qualsiasi punteggio di
 * affinità, perché ci mette in mezzo la reputazione di qualcuno.
 */
export function useIntros(): {
  intros: IntroRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  introduce: (
    aId: string,
    bId: string,
    message: string,
  ) => Promise<{ error: string | null }>;
  respond: (introId: string, status: 'accepted' | 'declined') => Promise<{ error: string | null }>;
} {
  const { user, isDemo } = useAuth();
  const [rows, setRows] = useState<IntroRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setRows([]);
      return;
    }
    if (isDemo) {
      setRows(demoIntros);
      return;
    }

    setLoading(true);
    const { data } = await getSupabase()
      .from('intros')
      .select(
        'id, introducer_id, profile_a_id, profile_b_id, message, status, created_at,' +
          'a:profiles!intros_profile_a_id_fkey(*),' +
          'b:profiles!intros_profile_b_id_fkey(*),' +
          'introducer:profiles!intros_introducer_id_fkey(*)',
      )
      .order('created_at', { ascending: false })
      .limit(50);

    const list = (data ?? []) as unknown as Omit<IntroRow, 'direction'>[];
    setRows(
      list.map((r) => ({
        ...r,
        direction: r.introducer_id === user.id ? 'made' : 'received',
      })),
    );
    setLoading(false);
  }, [user, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const introduce = useCallback(
    async (aId: string, bId: string, message: string) => {
      if (!user) return { error: "Non hai fatto l'accesso" };
      if (isDemo) return { error: null };
      if (aId === bId) return { error: 'Servono due persone diverse.' };

      // La coppia è canonica nel database: profile_a_id < profile_b_id.
      const [a, b] = aId < bId ? [aId, bId] : [bId, aId];

      const { error } = await getSupabase().from('intros').insert({
        introducer_id: user.id,
        profile_a_id: a,
        profile_b_id: b,
        message: message.trim() || null,
      });

      if (error) {
        return {
          error: /row-level security|violates/i.test(error.message)
            ? 'Puoi presentare solo due persone con cui sei connesso.'
            : error.message,
        };
      }
      await refresh();
      return { error: null };
    },
    [user, isDemo, refresh],
  );

  const respond = useCallback(
    async (introId: string, status: 'accepted' | 'declined') => {
      if (isDemo) return { error: null };
      const { error } = await getSupabase()
        .from('intros')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', introId);
      if (error) return { error: error.message };
      await refresh();
      return { error: null };
    },
    [isDemo, refresh],
  );

  return useMemo(
    () => ({ intros: rows, loading, refresh, introduce, respond }),
    [rows, loading, refresh, introduce, respond],
  );
}
