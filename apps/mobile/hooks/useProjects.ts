import type { Project, ProjectStatus } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoProjects } from '@/lib/demo';
import { lobbyUserError } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type ProjectDraft = {
  title: string;
  public_pitch: string;
  role_title: string | null;
  status: ProjectStatus;
  deck_requestable: boolean;
  is_visible: boolean;
};

/** Showcase: progetti curati a mano — non è un feed. */
export function useProjects(): {
  projects: Project[];
  loading: boolean;
  refresh: () => Promise<void>;
  createProject: (draft: ProjectDraft) => Promise<{ error: string | null }>;
  updateProject: (id: string, draft: ProjectDraft) => Promise<{ error: string | null }>;
  deleteProject: (id: string) => Promise<{ error: string | null }>;
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
        .select(
          'id, profile_id, title, public_pitch, deck_requestable, role_title, status, sort_order, is_visible, created_at, updated_at',
        )
        .eq('profile_id', user.id)
        .order('sort_order', { ascending: true })
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

  const createProject = useCallback(
    async (draft: ProjectDraft) => {
      if (isDemo) {
        const now = new Date().toISOString();
        setProjects((prev) => [
          {
            id: `demo-${now}`,
            profile_id: user?.id ?? 'demo',
            private_deck_url: null,
            sort_order: prev.length,
            created_at: now,
            updated_at: now,
            ...draft,
          },
          ...prev,
        ]);
        return { error: null };
      }
      if (!user) return { error: "Non hai fatto l'accesso" };
      const { error } = await getSupabase().from('projects').insert({
        profile_id: user.id,
        title: draft.title,
        public_pitch: draft.public_pitch,
        role_title: draft.role_title,
        status: draft.status,
        deck_requestable: draft.deck_requestable,
        is_visible: draft.is_visible,
      });
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      await refresh();
      return { error: null };
    },
    [isDemo, user, refresh],
  );

  const updateProject = useCallback(
    async (id: string, draft: ProjectDraft) => {
      if (isDemo) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, ...draft, updated_at: new Date().toISOString() } : p,
          ),
        );
        return { error: null };
      }
      if (!user) return { error: "Non hai fatto l'accesso" };
      const { error } = await getSupabase()
        .from('projects')
        .update({
          title: draft.title,
          public_pitch: draft.public_pitch,
          role_title: draft.role_title,
          status: draft.status,
          deck_requestable: draft.deck_requestable,
          is_visible: draft.is_visible,
        })
        .eq('id', id)
        .eq('profile_id', user.id);
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      await refresh();
      return { error: null };
    },
    [isDemo, user, refresh],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (isDemo) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        return { error: null };
      }
      if (!user) return { error: "Non hai fatto l'accesso" };
      const { error } = await getSupabase()
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('profile_id', user.id);
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      await refresh();
      return { error: null };
    },
    [isDemo, user, refresh],
  );

  return { projects, loading, refresh, createProject, updateProject, deleteProject };
}
