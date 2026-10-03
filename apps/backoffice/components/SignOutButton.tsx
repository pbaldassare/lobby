'use client';

import { signOut } from '@/lib/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="btn btn-ghost" type="submit">
        Esci
      </button>
    </form>
  );
}
