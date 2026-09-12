import type { Profile } from '@lobby/shared/types';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { demoProfile } from '@/lib/demo';
import { isEnvConfigured } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

function publicAuthError(message: string | undefined): string | null {
  if (!message) return null;
  if (/invalid login credentials/i.test(message)) return 'Email o password non corretti.';
  if (/email not confirmed/i.test(message)) return 'Conferma l’email prima di entrare.';
  if (/user already registered/i.test(message)) return 'Questo account esiste già. Accedi.';
  return message;
}

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'google' | 'linkedin_oidc') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    patch: Partial<
      Pick<Profile, 'display_name' | 'headline' | 'spotlight' | 'offer' | 'seek' | 'company'>
    >,
  ) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const isDemo = !isEnvConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [demoSignedIn, setDemoSignedIn] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (isDemo) {
      setProfile(demoProfile);
      return;
    }
    const userId = (await getSupabase().auth.getUser()).data.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await getSupabase().from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const supabase = getSupabase();
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => setSession(next));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) return;
    if (session?.user) void refreshProfile();
    else setProfile(null);
  }, [session, isDemo, refreshProfile]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isDemo) {
        setDemoSignedIn(true);
        setProfile(demoProfile);
        return { error: null };
      }
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      return { error: publicAuthError(error?.message) };
    },
    [isDemo],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (isDemo) {
        setDemoSignedIn(true);
        setProfile(demoProfile);
        return { error: null };
      }
      const { error } = await getSupabase().auth.signUp({ email, password });
      return { error: publicAuthError(error?.message) };
    },
    [isDemo],
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'linkedin_oidc') => {
      if (isDemo) {
        setDemoSignedIn(true);
        setProfile(demoProfile);
        return { error: null };
      }
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : Linking.createURL('auth/callback');
      if (Platform.OS === 'web') {
        const { error } = await getSupabase().auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: false },
        });
        return { error: publicAuthError(error?.message) };
      }
      const { data, error } = await getSupabase().auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return { error: publicAuthError(error.message) };
      if (!data.url) return { error: 'Il provider non ha restituito un indirizzo di accesso.' };
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        return { error: result.type === 'cancel' ? null : 'Accesso interrotto.' };
      }
      const url = Linking.parse(result.url);
      const code = typeof url.queryParams?.code === 'string' ? url.queryParams.code : null;
      if (code) {
        const { error: exchangeError } = await getSupabase().auth.exchangeCodeForSession(code);
        return { error: publicAuthError(exchangeError?.message) };
      }
      return { error: null };
    },
    [isDemo],
  );

  const signOut = useCallback(async () => {
    if (isDemo) {
      setDemoSignedIn(false);
      setProfile(null);
      return;
    }
    const uid = session?.user?.id;
    // Clear own presence while session is valid (visibility off on exit)
    if (uid) {
      await getSupabase().from('presence').delete().eq('profile_id', uid);
    }
    await getSupabase().auth.signOut();
    setProfile(null);
  }, [isDemo, session?.user?.id]);

  const updateProfile = useCallback(
    async (
      patch: Partial<
        Pick<Profile, 'display_name' | 'headline' | 'spotlight' | 'offer' | 'seek' | 'company'>
      >,
    ) => {
      if (isDemo) {
        setProfile((prev) => (prev ? { ...prev, ...patch, updated_at: new Date().toISOString() } : prev));
        return { error: null };
      }
      const userId = session?.user?.id;
      if (!userId) return { error: 'Not signed in' };
      const { data, error } = await getSupabase()
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select('*')
        .maybeSingle();
      if (error) return { error: error.message };
      setProfile((data as Profile | null) ?? null);
      return { error: null };
    },
    [isDemo, session?.user?.id],
  );

  const value = useMemo<AuthContextValue>(() => {
    const demoUser = demoSignedIn
      ? ({ id: demoProfile.id, email: 'demo@lobby.app' } as User)
      : null;
    return {
      session: isDemo ? null : session,
      user: isDemo ? demoUser : session?.user ?? null,
      profile: isDemo ? (demoSignedIn ? profile : null) : profile,
      loading,
      isDemo,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      refreshProfile,
      updateProfile,
    };
  }, [
    isDemo,
    demoSignedIn,
    session,
    profile,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    refreshProfile,
    updateProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
