import { LoginForm } from '@/components/LoginForm';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMessage =
    params.error === 'forbidden'
      ? 'Access denied. Only venue staff and admins can enter the backoffice.'
      : params.error === 'config'
        ? 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        : params.error
          ? params.error
          : null;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 8 }}>
          Lobby
        </div>
        <p className="kicker">Venue backoffice</p>
        <h1>Staff sign in</h1>
        <p>
          Members cannot access this console. Sign in with a staff or admin
          account for your venue.
        </p>
        {errorMessage ? <div className="error">{errorMessage}</div> : null}
        <LoginForm />
      </div>
    </div>
  );
}
