'use client';

import { useActionState } from 'react';
import {
  signInWithPassword,
  type AuthActionResult,
} from '@/lib/actions/auth';

const initial: AuthActionResult | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initial,
  );

  return (
    <form action={formAction}>
      {state && !state.ok ? <div className="error">{state.error}</div> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button className="btn btn-gold" type="submit" disabled={pending}>
        {pending ? 'Accesso in corso…' : 'Accedi'}
      </button>
    </form>
  );
}
