import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { LOBBY_DB_SCHEMA } from '@lobby/shared/supabase';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = ['/login', '/auth/callback'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Session refresh + coarse role gate.
 * Privileged writes still re-check staff + venue in server actions.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    if (!isPublicPath(request.nextUrl.pathname) && request.nextUrl.pathname !== '/') {
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      login.searchParams.set('error', 'config');
      return NextResponse.redirect(login);
    }
    return response;
  }

  const supabase = createServerClient(url, anon, {
    db: { schema: LOBBY_DB_SCHEMA },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname) && pathname !== '/') {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (user && !isPublicPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role as string | undefined;
    if (role !== 'staff' && role !== 'admin') {
      await supabase.auth.signOut();
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      login.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(login);
    }
  }

  if (user && pathname === '/login') {
    const dash = request.nextUrl.clone();
    dash.pathname = '/dashboard';
    return NextResponse.redirect(dash);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
