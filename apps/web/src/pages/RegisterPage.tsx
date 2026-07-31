import { Turnstile } from '@marsidev/react-turnstile';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';

export function RegisterPage() {
  const { registerEmail, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: '/register' });
  const { siteKey, turnstileToken, setTurnstileToken, verifyTurnstile, requiresTurnstile } = useTurnstile();

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

  async function handleGoogle() {
    setError('');
    try {
      const ok = await verifyTurnstile();
      if (!ok) {
        setError('Completa la verificación de seguridad');
        return;
      }
      await loginGoogle();
      await afterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error con Google');
    }
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza a usar MatuSMS en minutos"
      footer={
        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-brand hover:underline">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Nombre (opcional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            placeholder="Tu nombre"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Correo electrónico</label>
          <input
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
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Contraseña</label>
          <input
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
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Confirmar contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="auth-input"
            placeholder="Repite tu contraseña"
            required
            autoComplete="new-password"
          />
        </div>

        {siteKey && (
          <div className="flex justify-center pt-1">
            <Turnstile
              siteKey={siteKey}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: 'light' }}
            />
          </div>
        )}

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || (requiresTurnstile && !turnstileToken)}
          className="auth-btn-primary"
        >
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">o</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button type="button" onClick={handleGoogle} className="auth-btn-secondary">
        Registrarse con Google
      </button>

      <p className="mt-6 text-center text-xs text-slate-400">
        Al registrarte aceptas los{' '}
        <Link to="/legal" className="text-brand hover:underline">
          términos y privacidad
        </Link>
      </p>
    </AuthShell>
  );
}
