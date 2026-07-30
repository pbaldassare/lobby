import type { Project } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoProjects } from '@/lib/demo';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

/** Showcase: curated projects — not a social feed. */
export function useProjects(): {
  projects: Project[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setProjects(demoProjects);
      return;
    }
    if (!user) {
      setProjects([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('projects')
        .select('*')
        .eq('profile_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      setProjects((data ?? []) as Project[]);
    } catch (err) {
      console.warn('useProjects', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { projects, loading, refresh };
}
