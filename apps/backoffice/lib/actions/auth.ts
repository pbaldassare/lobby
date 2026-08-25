'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isStaffRole, type UserRole } from '@lobby/shared';
import { createClient } from '@/lib/supabase/server';

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signInWithPassword(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Session not established' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as UserRole | undefined) ?? 'member';
  if (!isStaffRole(role)) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: 'Access denied. Backoffice is for venue staff and admins only.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
