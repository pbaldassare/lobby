import type { MemberDocument } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { demoCv } from '@/lib/demo';
import { lobbyUserError } from '@/lib/errors';
import { canPickDocument, pickDocument } from '@/lib/pickDocument';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const CV_BUCKET = 'lobby-docs';

function safeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-|-$/g, '');
  return base.length > 0 ? base.slice(0, 120) : 'curriculum.pdf';
}

export function useDocuments(): {
  cv: MemberDocument | null;
  loading: boolean;
  canUpload: boolean;
  refresh: () => Promise<void>;
  uploadCv: () => Promise<{ error: string | null }>;
  removeCv: () => Promise<{ error: string | null }>;
  openOwnCv: () => Promise<{ error: string | null }>;
  openPeerCv: (profileId: string) => Promise<{ error: string | null }>;
} {
  const { user, isDemo } = useAuth();
  const [cv, setCv] = useState<MemberDocument | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setCv(demoCv);
      return;
    }
    if (!user) {
      setCv(null);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from('documents')
        .select('*')
        .eq('profile_id', user.id)
        .eq('kind', 'cv')
        .maybeSingle();
      if (error) throw error;
      setCv((data as MemberDocument | null) ?? null);
    } catch (err) {
      console.warn('useDocuments', err);
      setCv(null);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openPath = useCallback(async (path: string) => {
    const { data, error } = await getSupabase().storage.from(CV_BUCKET).createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      return { error: lobbyUserError(error?.message) ?? 'Impossibile aprire il file.' };
    }
    if (typeof window !== 'undefined') {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
    return { error: null };
  }, []);

  const uploadCv = useCallback(async () => {
    if (isDemo) return { error: null };
    if (!user) return { error: "Non hai fatto l'accesso" };
    if (!canPickDocument()) {
      return { error: 'Il caricamento del CV è disponibile nella versione web.' };
    }
    const picked = await pickDocument();
    if (!picked) return { error: null };
    if (picked.bytes.byteLength > 10 * 1024 * 1024) {
      return { error: 'Il file supera i 10 MB.' };
    }

    const fileName = safeFileName(picked.name);
    const path = `${user.id}/cv/${fileName}`;
    const client = getSupabase();

    if (cv?.file_path && cv.file_path !== path) {
      await client.storage.from(CV_BUCKET).remove([cv.file_path]);
    }

    const body = new Blob([new Uint8Array(picked.bytes)], { type: picked.mime });
    const { error: upError } = await client.storage.from(CV_BUCKET).upload(path, body, {
      contentType: picked.mime,
      upsert: true,
    });
    if (upError) return { error: lobbyUserError(upError.message) ?? upError.message };

    const row = {
      profile_id: user.id,
      kind: 'cv' as const,
      file_path: path,
      file_name: fileName,
      mime_type: picked.mime,
      byte_size: picked.bytes.byteLength,
    };

    const { error: dbError } = cv
      ? await client.from('documents').update(row).eq('id', cv.id).eq('profile_id', user.id)
      : await client.from('documents').insert(row);
    if (dbError) return { error: lobbyUserError(dbError.message) ?? dbError.message };
    await refresh();
    return { error: null };
  }, [isDemo, user, cv, refresh]);

  const removeCv = useCallback(async () => {
    if (isDemo) {
      setCv(null);
      return { error: null };
    }
    if (!user || !cv) return { error: null };
    const client = getSupabase();
    await client.storage.from(CV_BUCKET).remove([cv.file_path]);
    const { error } = await client.from('documents').delete().eq('id', cv.id).eq('profile_id', user.id);
    if (error) return { error: lobbyUserError(error.message) ?? error.message };
    await refresh();
    return { error: null };
  }, [isDemo, user, cv, refresh]);

  const openOwnCv = useCallback(async () => {
    if (!cv) return { error: 'Nessun curriculum caricato.' };
    if (isDemo) return { error: null };
    return openPath(cv.file_path);
  }, [cv, isDemo, openPath]);

  const openPeerCv = useCallback(
    async (profileId: string) => {
      if (isDemo) return { error: null };
      const { data, error } = await getSupabase()
        .from('documents')
        .select('*')
        .eq('profile_id', profileId)
        .eq('kind', 'cv')
        .maybeSingle();
      if (error) return { error: lobbyUserError(error.message) ?? error.message };
      const doc = data as MemberDocument | null;
      if (!doc) return { error: 'Nessun curriculum condiviso.' };
      return openPath(doc.file_path);
    },
    [isDemo, openPath],
  );

  return {
    cv,
    loading,
    canUpload: canPickDocument() || isDemo,
    refresh,
    uploadCv,
    removeCv,
    openOwnCv,
    openPeerCv,
  };
}
