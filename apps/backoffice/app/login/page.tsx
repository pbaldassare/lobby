import { BrandMark } from '@/components/BrandMark';
import { LoginForm } from '@/components/LoginForm';

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props): Promise<React.JSX.Element> {
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
        <BrandMark />
        <p className="kicker">Back-office del venue</p>
        <h1>Accedi</h1>
        <p>
          Solo staff e amministratori. I membri restano sull’app. Il sigillo lo
          rilascia il venue, non l’utente.
        </p>
        {errorMessage ? <div className="error">{errorMessage}</div> : null}
        <LoginForm />
      </div>
    </div>
  );
}
