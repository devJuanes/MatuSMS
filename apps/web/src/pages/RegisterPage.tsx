import { Turnstile } from '@marsidev/react-turnstile';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';

export function RegisterPage() {
  const { registerEmail } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/register' });
  const { siteKey, turnstileToken, setTurnstileToken, verifyTurnstile, requiresTurnstile } =
    useTurnstile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function afterAuth() {
    if (redirect) {
      window.location.assign(redirect);
      return;
    }
    navigate({ to: '/mensajes', search: { owner: undefined, contact: undefined, nuevo: undefined } });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const ok = await verifyTurnstile();
      if (!ok) {
        setError('Completa la verificación de seguridad');
        return;
      }
      await registerEmail(email, password, name || undefined);
      await afterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Sin tarjeta. Vincula tu Android y envía el primer SMS en minutos."
      footer={
        <div className="space-y-4 text-center">
          <p className="text-sm text-neutral-500">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="font-semibold text-brand hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
          <p className="text-xs text-neutral-400">
            Al registrarte aceptas los{' '}
            <Link to="/legal" className="text-brand hover:underline">
              términos y privacidad
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium text-ink">
            Nombre <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            placeholder="Tu nombre"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-ink">
            Correo electrónico
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="Mínimo 8 caracteres"
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="register-confirm" className="mb-1.5 block text-sm font-medium text-ink">
            Confirmar contraseña
          </label>
          <input
            id="register-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="auth-input"
            placeholder="Repite tu contraseña"
            required
            autoComplete="new-password"
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
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
