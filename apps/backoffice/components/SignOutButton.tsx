'use client';

import { signOut } from '@/lib/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="btn btn-ghost" type="submit">
        Sign out
      </button>
    </form>
  );
}
