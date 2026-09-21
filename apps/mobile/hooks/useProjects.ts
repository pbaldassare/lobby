import type { Project, ProjectStatus } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoProjects } from '@/lib/demo';
import { lobbyUserError } from '@/lib/errors';
import { canPickDocument, pickDocument, type PickedDocument } from '@/lib/pickDocument';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const DECK_BUCKET = 'lobby-docs';
const DECK_MAX_BYTES = 10 * 1024 * 1024;

function safeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-|-$/g, '');
  return base.length > 0 ? base.slice(0, 120) : 'deck.pdf';
}

function titleFromFileName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return stem.length > 0 ? stem.slice(0, 80) : 'Progetto';
}

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
  canUpload: boolean;
  createProject: (draft: ProjectDraft) => Promise<{ error: string | null; id: string | null }>;
  createProjects: (drafts: ProjectDraft[]) => Promise<{ error: string | null; created: number }>;
  createProjectFromFile: () => Promise<{ error: string | null; id: string | null }>;
  updateProject: (id: string, draft: ProjectDraft) => Promise<{ error: string | null }>;
  deleteProject: (id: string) => Promise<{ error: string | null }>;
  uploadDeck: (id: string, picked?: PickedDocument) => Promise<{ error: string | null }>;
  removeDeck: (id: string) => Promise<{ error: string | null }>;
  openOwnDeck: (id: string) => Promise<{ error: string | null }>;
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
          'id, profile_id, title, public_pitch, private_deck_file_name, deck_requestable, role_title, status, sort_order, is_visible, created_at, updated_at',
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
            private_deck_file_name: null,
            sort_order: prev.length,
            created_at: now,
            updated_at: now,
            ...draft,
          },
          ...prev,
        ]);
        return { error: null, id: `demo-${now}` };
      }
      if (!user) return { error: "Non hai fatto l'accesso", id: null };
      const { data, error } = await getSupabase()
        .from('projects')
        .insert({
          profile_id: user.id,
          title: draft.title,
          public_pitch: draft.public_pitch,
          role_title: draft.role_title,
          status: draft.status,
          deck_requestable: draft.deck_requestable,
          is_visible: draft.is_visible,
        })
        .select('id')
        .single();
      if (error) return { error: lobbyUserError(error.message) ?? error.message, id: null };
      await refresh();
      return { error: null, id: (data?.id as string | undefined) ?? null };
    },
    [isDemo, user, refresh],
  );

  const createProjects = useCallback(
    async (drafts: ProjectDraft[]) => {
      const clean = drafts
        .map((d) => ({
          ...d,
          title: d.title.trim(),
          public_pitch: d.public_pitch.trim(),
          role_title: d.role_title?.trim() || null,
        }))
        .filter((d) => d.title.length > 0);
      if (clean.length === 0) return { error: 'Nessun progetto da salvare.', created: 0 };

      if (isDemo) {
        const now = new Date().toISOString();
        setProjects((prev) => [
          ...clean.map((draft, i) => ({
            id: `demo-${now}-${i}`,
            profile_id: user?.id ?? 'demo',
            private_deck_url: null,
            private_deck_file_name: null,
            sort_order: prev.length + i,
            created_at: now,
            updated_at: now,
            ...draft,
          })),
          ...prev,
        ]);
        return { error: null, created: clean.length };
      }
      if (!user) return { error: "Non hai fatto l'accesso", created: 0 };

      const existingTitles = new Set(projects.map((p) => p.title.trim().toLowerCase()));
      const fresh = clean.filter((d) => !existingTitles.has(d.title.toLowerCase()));
      if (fresh.length === 0) {
        return { error: 'Questi progetti sono già sulla card.', created: 0 };
      }

      const { error } = await getSupabase()
        .from('projects')
        .insert(
          fresh.map((draft) => ({
            profile_id: user.id,
            title: draft.title,
            public_pitch: draft.public_pitch,
            role_title: draft.role_title,
            status: draft.status,
            deck_requestable: draft.deck_requestable,
            is_visible: draft.is_visible,
          })),
        );
      if (error) return { error: lobbyUserError(error.message) ?? error.message, created: 0 };
      await refresh();
      return { error: null, created: fresh.length };
    },
    [isDemo, user, projects, refresh],
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

  const openPath = useCallback(async (path: string) => {
    const { data, error } = await getSupabase().storage.from(DECK_BUCKET).createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      return { error: lobbyUserError(error?.message) ?? 'Impossibile aprire il file.' };
    }
    if (typeof window !== 'undefined') {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
    return { error: null };
  }, []);

  const uploadDeck = useCallback(
    async (id: string, alreadyPicked?: PickedDocument) => {
      if (isDemo) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  private_deck_file_name: alreadyPicked?.name ?? 'deck.pdf',
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        );
        return { error: null };
      }
      if (!user) return { error: "Non hai fatto l'accesso" };
      if (!alreadyPicked && !canPickDocument()) {
        return { error: 'Il caricamento è disponibile nella versione web.' };
      }
      const picked = alreadyPicked ?? (await pickDocument());
      if (!picked) return { error: null };
      if (picked.bytes.byteLength > DECK_MAX_BYTES) {
        return { error: 'Il file supera i 10 MB.' };
      }

      const fileName = safeFileName(picked.name);
      const path = `${user.id}/decks/${id}/${fileName}`;
      const client = getSupabase();

      const { data: previous } = await client.rpc('project_deck_url', { p_project_id: id });
      if (typeof previous === 'string' && previous.length > 0 && previous !== path) {
        await client.storage.from(DECK_BUCKET).remove([previous]);
      }

      const body = new Blob([new Uint8Array(picked.bytes)], { type: picked.mime });
      const { error: upError } = await client.storage.from(DECK_BUCKET).upload(path, body, {
        contentType: picked.mime,
        upsert: true,
      });
      if (upError) return { error: lobbyUserError(upError.message) ?? upError.message };

      const { error } = await client
        .from('projects')
        .update({
          private_deck_url: path,
          private_deck_file_name: fileName,
        })
        .eq('id', id)
        .eq('profile_id', user.id);
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      await refresh();
      return { error: null };
    },
    [isDemo, user, refresh],
  );

  const removeDeck = useCallback(
    async (id: string) => {
      if (isDemo) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, private_deck_file_name: null, updated_at: new Date().toISOString() }
              : p,
          ),
        );
        return { error: null };
      }
      if (!user) return { error: "Non hai fatto l'accesso" };
      const client = getSupabase();
      const { data: previous } = await client.rpc('project_deck_url', { p_project_id: id });
      if (typeof previous === 'string' && previous.length > 0) {
        await client.storage.from(DECK_BUCKET).remove([previous]);
      }
      const { error } = await client
        .from('projects')
        .update({ private_deck_url: null, private_deck_file_name: null })
        .eq('id', id)
        .eq('profile_id', user.id);
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      await refresh();
      return { error: null };
    },
    [isDemo, user, refresh],
  );

  const openOwnDeck = useCallback(
    async (id: string) => {
      if (isDemo) return { error: null };
      const { data, error } = await getSupabase().rpc('project_deck_url', { p_project_id: id });
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      if (typeof data !== 'string' || data.length === 0) {
        return { error: 'Nessun file caricato.' };
      }
      return openPath(data);
    },
    [isDemo, openPath],
  );

  const createProjectFromFile = useCallback(async () => {
    if (isDemo) {
      const created = await createProject({
        title: 'Progetto caricato',
        public_pitch: '',
        role_title: null,
        status: 'active',
        deck_requestable: true,
        is_visible: true,
      });
      if (created.id) {
        await uploadDeck(created.id);
      }
      return created;
    }
    if (!user) return { error: "Non hai fatto l'accesso", id: null };
    if (!canPickDocument()) {
      return { error: 'Il caricamento è disponibile nella versione web.', id: null };
    }
    const picked = await pickDocument();
    if (!picked) return { error: null, id: null };
    if (picked.bytes.byteLength > DECK_MAX_BYTES) {
      return { error: 'Il file supera i 10 MB.', id: null };
    }

    const created = await createProject({
      title: titleFromFileName(picked.name),
      public_pitch: '',
      role_title: null,
      status: 'active',
      deck_requestable: true,
      is_visible: true,
    });
    if (created.error || !created.id) return created;
    const uploaded = await uploadDeck(created.id, picked);
    if (uploaded.error) return { error: uploaded.error, id: created.id };
    return created;
  }, [isDemo, user, createProject, uploadDeck]);

  const deleteProject = useCallback(
    async (id: string) => {
      if (isDemo) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        return { error: null };
      }
      if (!user) return { error: "Non hai fatto l'accesso" };
      const client = getSupabase();
      const { data: previous } = await client.rpc('project_deck_url', { p_project_id: id });
      if (typeof previous === 'string' && previous.length > 0) {
        await client.storage.from(DECK_BUCKET).remove([previous]);
      }
      const { error } = await client.from('projects').delete().eq('id', id).eq('profile_id', user.id);
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      await refresh();
      return { error: null };
    },
    [isDemo, user, refresh],
  );

  return {
    projects,
    loading,
    refresh,
    canUpload: canPickDocument() || isDemo,
    createProject,
    createProjects,
    createProjectFromFile,
    updateProject,
    deleteProject,
    uploadDeck,
    removeDeck,
    openOwnDeck,
  };
}
