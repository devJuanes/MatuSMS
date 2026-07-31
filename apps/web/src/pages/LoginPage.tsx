import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { useState } from 'react';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function LoginPage() {
  const { loginEmail, loginGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(
    TURNSTILE_SITE_KEY ? null : 'dev-bypass',
  );

  async function verifyTurnstile(): Promise<boolean> {
    if (!TURNSTILE_SITE_KEY) return true;
    if (!turnstileToken) return false;
    try {
      await apiFetch('/v1/auth/verify-turnstile', {
        method: 'POST',
        body: JSON.stringify({ token: turnstileToken }),
      });
      return true;
    } catch {
      return false;
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const ok = await verifyTurnstile();
      if (!ok) {
        setError('Please complete the security check');
        return;
      }
      await loginEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
            M
          </div>
          <h1 className="text-2xl font-bold">MatuSMS</h1>
          <p className="mt-1 text-sm text-zinc-400">SMS Gateway Dashboard</p>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-brand"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-brand"
            required
          />
          {TURNSTILE_SITE_KEY && (
            <div className="flex justify-center">
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: 'dark' }}
              />
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || (TURNSTILE_SITE_KEY ? !turnstileToken : false)}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-500">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <button
          onClick={() => loginGoogle().catch((e) => setError(e.message))}
          className="w-full rounded-lg border border-zinc-700 py-2.5 text-sm hover:bg-zinc-800"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <a href="/legal" className="text-brand hover:underline">
            Terms & Privacy
          </a>
        </p>
      </div>
    </div>
  );
}
