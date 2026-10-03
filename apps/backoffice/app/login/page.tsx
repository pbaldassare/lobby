import { LoginForm } from '@/components/LoginForm';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMessage =
    params.error === 'forbidden'
      ? 'Accesso negato. Solo staff e amministratori del venue possono entrare.'
      : params.error === 'config'
        ? 'Manca la configurazione Supabase del back-office.'
        : params.error === 'auth_callback'
          ? 'Accesso non completato. Riprova.'
          : params.error
            ? params.error
            : null;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 8 }}>
          Lobby
        </div>
        <p className="kicker">Back-office del venue</p>
        <h1>Accesso staff</h1>
        <p>
          I membri non possono entrare in questa console. Accedi con un account
          staff o amministratore del tuo venue.
        </p>
        {errorMessage ? <div className="error">{errorMessage}</div> : null}
        <LoginForm />
      </div>
    </div>
  );
}
