import { NextResponse } from 'next/server';
import { isStaffRole, type UserRole } from '@lobby/shared';
import { createClient } from '@/lib/supabase/server';

/** OAuth / magic-link callback. Rejects members after session exchange. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/istanze';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        const role = (profile?.role as UserRole | undefined) ?? 'member';
        if (!isStaffRole(role)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=forbidden`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
