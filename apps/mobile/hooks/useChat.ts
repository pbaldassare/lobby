import type { Chat, Message, Profile } from '@lobby/shared/types';
import { useCallback, useEffect, useState } from 'react';

import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type ChatListItem = Chat & {
  other: Profile | null;
  lastMessage: Message | null;
};

/** Chat only after mutual connection (RLS + UI gate). */
export function useChatList(): {
  chats: ChatListItem[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { user, isDemo } = useAuth();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || isDemo) {
      setChats([]);
      return;
    }
    setLoading(true);
    const { data } = await getSupabase()
      .from('chats')
      .select('*')
      .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    const rows = (data as Chat[] | null) ?? [];
    const otherIds = [...new Set(rows.map((c) => (c.profile_a_id === user.id ? c.profile_b_id : c.profile_a_id)))];
    const { data: profiles } = await getSupabase().from('profiles').select('*').in('id', otherIds);
    const map = new Map(((profiles as Profile[] | null) ?? []).map((p) => [p.id, p]));
    const items: ChatListItem[] = [];
    for (const c of rows) {
      const otherId = c.profile_a_id === user.id ? c.profile_b_id : c.profile_a_id;
      const { data: msgs } = await getSupabase()
        .from('messages')
        .select('*')
        .eq('chat_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1);
      items.push({
        ...c,
        other: map.get(otherId) ?? null,
        lastMessage: ((msgs as Message[] | null) ?? [])[0] ?? null,
      });
    }
    setChats(items);
    setLoading(false);
  }, [user, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { chats, loading, refresh };
}

export function useChatThread(chatId: string | undefined): {
  messages: Message[];
  connected: boolean;
  loading: boolean;
  sendMessage: (body: string) => Promise<{ error: string | null }>;
} {
  const { user, isDemo } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !chatId || isDemo) {
      setMessages([]);
      setConnected(false);
      return;
    }
    setLoading(true);
    const { data: chat } = await getSupabase().from('chats').select('*').eq('id', chatId).maybeSingle();
    const row = chat as Chat | null;
    if (!row) {
      setConnected(false);
      setMessages([]);
      setLoading(false);
      return;
    }
    const { data: isConn } = await getSupabase().rpc('are_connected', {
      a: row.profile_a_id,
      b: row.profile_b_id,
    });
    setConnected(Boolean(isConn));
    const { data: msgs } = await getSupabase()
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages((msgs as Message[] | null) ?? []);
    setLoading(false);
  }, [user, chatId, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!chatId || isDemo) return;
    const channel = getSupabase()
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .subscribe();
    return () => {
      void getSupabase().removeChannel(channel);
    };
  }, [chatId, isDemo]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!user || !chatId) return { error: 'Missing chat' };
      if (!connected) return { error: 'Chat unlocks only after mutual connection.' };
      const trimmed = body.trim();
      if (!trimmed) return { error: 'Empty message' };
      const { error } = await getSupabase().from('messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        body: trimmed,
      });
      return { error: error?.message ?? null };
    },
    [user, chatId, connected],
  );

  return { messages, connected, loading, sendMessage };
}
