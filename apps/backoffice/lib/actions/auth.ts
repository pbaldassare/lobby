'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isStaffRole, type UserRole } from '@lobby/shared';
import { createClient } from '@/lib/supabase/server';

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

function staffAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'Email o password non corretti.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Conferma l’email prima di entrare.';
  }
  return 'Accesso non riuscito. Riprova.';
}

export async function signInWithPassword(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) {
    return { ok: false, error: 'Inserisci email e password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: staffAuthError(error.message) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessione non avviata.' };

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
      error: 'Accesso negato. Il back-office è riservato a staff e amministratori del venue.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/istanze');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
