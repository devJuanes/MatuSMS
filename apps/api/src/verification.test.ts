import { describe, it, expect } from 'vitest';
import {
  buildVerificationMessage,
  getVerificationTemplate,
  VERIFICATION_DEFAULTS,
} from '@matusms/shared';

describe('verification templates', () => {
  it('renders Spanish login template with code and minutes', () => {
    const msg = buildVerificationMessage('login', '482910', { locale: 'es' });
    expect(msg).toContain('482910');
    expect(msg).toContain('10');
  });

  it('uses custom template when provided', () => {
    const msg = buildVerificationMessage('custom', '1234', {
      template: 'OTP {{codigo}} — {{minutos}} min',
      expiresInSeconds: 300,
    });
    expect(msg).toBe('OTP 1234 — 5 min');
  });

  it('has templates for all purposes', () => {
    for (const purpose of ['login', 'register', 'password_reset', 'transaction', 'custom']) {
      expect(getVerificationTemplate(purpose as 'login', 'es')).toContain('{{codigo}}');
    }
  });

  it('defaults', () => {
    expect(VERIFICATION_DEFAULTS.expiresInSeconds).toBe(600);
    expect(VERIFICATION_DEFAULTS.maxAttempts).toBe(5);
  });
});
