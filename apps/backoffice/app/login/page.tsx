import { LoginForm } from '@/components/LoginForm';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMessage =
    params.error === 'forbidden'
      ? 'Accesso negato. Nel backoffice entrano solo lo staff del venue e gli amministratori.'
      : params.error === 'config'
        ? 'Manca NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        : params.error
          ? params.error
          : null;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 8 }}>
          Lobby
        </div>
        <p className="kicker">Backoffice del venue</p>
        <h1>Accesso staff</h1>
        <p>
          I soci non entrano qui. Accedi con un account staff o
          amministratore del tuo venue.
        </p>
        {errorMessage ? <div className="error">{errorMessage}</div> : null}
        <LoginForm />
      </div>
    </div>
  );
}
