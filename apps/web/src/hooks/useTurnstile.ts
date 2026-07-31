import { useState } from 'react';
import { apiFetch } from '@/lib/api';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function useTurnstile() {
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

  return {
    siteKey: TURNSTILE_SITE_KEY,
    turnstileToken,
    setTurnstileToken,
    verifyTurnstile,
    requiresTurnstile: Boolean(TURNSTILE_SITE_KEY),
  };
}
