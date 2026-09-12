import type { Presence, Room } from '@lobby/shared/types';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { createDemoPresence, DEMO_ROOM_ID, demoRoom } from '@/lib/demo';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const HEARTBEAT_MS = 30_000;

/** Come dimostri di poter stare in una stanza. Tutti i canali rilasciano
 *  lo stesso permesso: cambia solo la prova. */
export type EnterRoomAccess = {
  code?: string;
  wifi?: string;
  claimEmail?: boolean;
  claimMembership?: boolean;
};

type PresenceContextValue = {
  room: Room | null;
  presence: Presence | null;
  isVisible: boolean;
  loading: boolean;
  enterRoom: (
    roomId: string,
    access?: EnterRoomAccess,
  ) => Promise<{ error: string | null }>;
  inviteToRoom: (guestId: string) => Promise<{ error: string | null }>;
  leaveRoom: () => Promise<{ error: string | null }>;
  setVisible: (visible: boolean) => Promise<{ error: string | null }>;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user, isDemo } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [presence, setPresence] = useState<Presence | null>(null);
  const [loading, setLoading] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    if (isDemo || !user) return;
    heartbeatRef.current = setInterval(() => {
      void getSupabase().rpc('heartbeat_presence');
    }, HEARTBEAT_MS);
  }, [clearHeartbeat, isDemo, user]);

  useEffect(() => {
    if (!user) {
      setPresence(null);
      setRoom(null);
      clearHeartbeat();
      return;
    }
    if (isDemo) {
      // After login: in room but invisible by default
      setRoom(demoRoom);
      setPresence(createDemoPresence(false));
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { data } = await getSupabase()
        .from('presence')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const row = data as Presence | null;
      setPresence(row);
      if (row?.room_id) {
        const { data: roomRow } = await getSupabase()
          .from('rooms')
          .select('id, venue_id, name, created_at, opens_at, closes_at')
          .eq('id', row.room_id)
          .maybeSingle();
        if (!cancelled) {
          setRoom((roomRow as Room | null) ?? null);
          if (row.is_visible) startHeartbeat();
        }
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isDemo, clearHeartbeat, startHeartbeat]);

  useEffect(() => () => clearHeartbeat(), [clearHeartbeat]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') clearHeartbeat();
      else if (presence?.is_visible) startHeartbeat();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [presence?.is_visible, clearHeartbeat, startHeartbeat]);

  const enterRoom = useCallback(
    async (roomId: string, access?: EnterRoomAccess) => {
      if (!user) return { error: "Non hai fatto l'accesso" };
      if (isDemo) {
        setRoom({ ...demoRoom, id: roomId || DEMO_ROOM_ID });
        setPresence(createDemoPresence(false));
        return { error: null };
      }

      // Prima il permesso, poi la presenza. Senza un permesso valido la
      // policy di inserimento rifiuta la riga: entrare non è più una cosa
      // che il client può dichiarare da sé.
      const client = getSupabase();
      if (access?.code) {
        const { error: passError } = await client.rpc('redeem_room_code', {
          p_room_id: roomId,
          p_code: access.code,
        });
        if (passError) return { error: passError.message };
      } else if (access?.wifi) {
        const { error: passError } = await client.rpc('claim_room_by_wifi', {
          p_room_id: roomId,
          p_network: access.wifi,
        });
        if (passError) return { error: passError.message };
      } else if (access?.claimEmail) {
        const { error: passError } = await client.rpc('claim_room_by_email', {
          p_room_id: roomId,
        });
        if (passError) return { error: passError.message };
      } else if (access?.claimMembership) {
        const { error: passError } = await client.rpc('claim_room_by_membership', {
          p_room_id: roomId,
        });
        if (passError) return { error: passError.message };
      }

      const { data, error } = await client
        .from('presence')
        .upsert(
          {
            profile_id: user.id,
            room_id: roomId,
            is_visible: false,
            visible_until: null,
            last_heartbeat: new Date().toISOString(),
            entered_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id' },
        )
        .select('*')
        .maybeSingle();
      if (error) {
        // Il messaggio grezzo del database non dice nulla a chi è sulla porta.
        return {
          error: /row-level security|violates/i.test(error.message)
            ? 'Serve un permesso valido per entrare in questa stanza.'
            : error.message,
        };
      }
      setPresence(data as Presence);
      const { data: roomRow } = await client
        .from('rooms')
        .select('id, venue_id, name, created_at, opens_at, closes_at')
        .eq('id', roomId)
        .maybeSingle();
      setRoom((roomRow as Room | null) ?? null);
      clearHeartbeat();
      return { error: null };
    },
    [user, isDemo, clearHeartbeat],
  );

  const inviteToRoom = useCallback(
    async (guestId: string) => {
      if (!user) return { error: "Non hai fatto l'accesso" };
      if (!presence?.room_id) return { error: 'Entra in una stanza prima di invitare.' };
      if (isDemo) return { error: null };
      const { error } = await getSupabase().rpc('invite_to_room', {
        p_room_id: presence.room_id,
        p_guest_id: guestId,
      });
      return { error: error?.message ?? null };
    },
    [user, isDemo, presence?.room_id],
  );

  const leaveRoom = useCallback(async () => {
    if (!user) return { error: 'Not signed in' };
    if (isDemo) {
      setPresence(null);
      setRoom(null);
      return { error: null };
    }
    clearHeartbeat();
    const { error } = await getSupabase().from('presence').delete().eq('profile_id', user.id);
    setPresence(null);
    setRoom(null);
    return { error: error?.message ?? null };
  }, [user, isDemo, clearHeartbeat]);

  const setVisible = useCallback(
    async (visible: boolean) => {
      if (!user) return { error: 'Not signed in' };
      if (!presence) return { error: 'Enter a room first' };
      if (isDemo) {
        setPresence(createDemoPresence(visible));
        return { error: null };
      }
      const visibleUntil = visible
        ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        : null;
      const { data, error } = await getSupabase().rpc('heartbeat_presence', {
        p_visible: visible,
        p_visible_until: visibleUntil,
      });
      if (error) {
        const { data: updated, error: updateError } = await getSupabase()
          .from('presence')
          .update({
            is_visible: visible,
            visible_until: visibleUntil,
            last_heartbeat: new Date().toISOString(),
          })
          .eq('profile_id', user.id)
          .select('*')
          .maybeSingle();
        if (updateError) return { error: updateError.message };
        setPresence(updated as Presence);
      } else {
        setPresence(data as Presence);
      }
      if (visible) startHeartbeat();
      else clearHeartbeat();
      return { error: null };
    },
    [user, presence, isDemo, startHeartbeat, clearHeartbeat],
  );

  const value = useMemo(
    () => ({
      room,
      presence,
      isVisible: presence?.is_visible ?? false,
      loading,
      enterRoom,
      inviteToRoom,
      leaveRoom,
      setVisible,
    }),
    [room, presence, loading, enterRoom, inviteToRoom, leaveRoom, setVisible],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider');
  return ctx;
}
