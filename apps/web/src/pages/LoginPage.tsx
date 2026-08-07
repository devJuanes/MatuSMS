import { Turnstile } from '@marsidev/react-turnstile';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';

export function LoginPage() {
  const { loginEmail } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/login' });
  const { siteKey, turnstileToken, setTurnstileToken, verifyTurnstile, requiresTurnstile } =
    useTurnstile();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function afterAuth() {
    if (redirect) {
      window.location.assign(redirect);
      return;
    }
    navigate({ to: '/mensajes', search: { owner: undefined, contact: undefined, nuevo: undefined } });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const ok = await verifyTurnstile();
      if (!ok) {
        setError('Completa la verificación de seguridad');
        return;
      }
      await loginEmail(email, password);
      await afterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Accede al panel para gestionar gateways, mensajes y API keys."
      footer={
        <div className="space-y-4 text-center">
          <p className="text-sm text-neutral-500">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              search={{ redirect: undefined }}
              className="font-semibold text-brand hover:underline"
            >
              Regístrate gratis
            </Link>
          </p>
          <p className="text-xs text-neutral-400">
            <Link to="/legal" className="hover:text-brand hover:underline">
              Términos y privacidad
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleEmail} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink">
            Correo electrónico
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="tu@empresa.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {siteKey ? (
          <div className="flex justify-center pt-1">
            <Turnstile
              siteKey={siteKey}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: 'light' }}
            />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-brand-light px-3 py-2.5 text-sm text-brand" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || (requiresTurnstile && !turnstileToken)}
          className="auth-btn-primary mt-1"
        >
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthShell>
  );
}
