import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  createLobbySupabaseClient,
  type SupabaseClient,
} from '@lobby/shared/supabase';
import { getMobileEnv } from './env';

const memoryStore = new Map<string, string>();

function webStorage(): Storage | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

const AuthStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return webStorage()?.getItem(key) ?? memoryStore.get(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      const storage = webStorage();
      if (storage) storage.setItem(key, value);
      else memoryStore.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      webStorage()?.removeItem(key);
      memoryStore.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const { supabaseUrl, supabaseAnonKey } = getMobileEnv();
  client = createLobbySupabaseClient({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    authStorage: AuthStorageAdapter,
    detectSessionInUrl: Platform.OS === 'web',
  });
  return client;
}

/** On web, construct the client immediately so PKCE can read `?code=` before the router strips it. */
if (Platform.OS === 'web') {
  getSupabase();
}

/** Prefer Edge Functions for privileged ops. Never service_role on device. */
export async function invokeEdgeFunction<TBody extends Record<string, unknown>, TResult>(
  name: 'send-signal' | 'compute-matches' | 'issue-seal',
  body: TBody,
): Promise<{ data: TResult | null; error: Error | null }> {
  if (name === 'issue-seal') {
    return {
      data: null,
      error: new Error('Seal is issued by the venue. Members cannot self-issue.'),
    };
  }
  const { data, error } = await getSupabase().functions.invoke(name, { body });
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as TResult, error: null };
}
