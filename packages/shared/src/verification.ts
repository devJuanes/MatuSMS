import type { VerificationLocale, VerificationPurpose } from './schemas.js';
import { renderTemplate } from './template.js';

/** Casos de uso típicos para SMS transaccional / OTP en apps SaaS. */
export const verificationPurposes = [
  'login',
  'register',
  'password_reset',
  'transaction',
  'custom',
] as const satisfies readonly VerificationPurpose[];

export const verificationLocales = ['es', 'en'] as const satisfies readonly VerificationLocale[];

export const VERIFICATION_DEFAULTS = {
  codeLength: 6,
  expiresInSeconds: 600,
  maxAttempts: 5,
  maxSendsPerWindow: 3,
  sendWindowSeconds: 900,
} as const;

const TEMPLATES: Record<VerificationLocale, Record<VerificationPurpose, string>> = {
  es: {
    login: 'Código de inicio de sesión: {{codigo}}. Válido {{minutos}} minutos.',
    register: 'Tu código de verificación es {{codigo}}. Válido {{minutos}} minutos.',
    password_reset: 'Código para restablecer contraseña: {{codigo}}. Válido {{minutos}} minutos.',
    transaction: 'Código de verificación: {{codigo}}. Válido {{minutos}} minutos.',
    custom: 'Tu código es {{codigo}}. Válido {{minutos}} minutos.',
  },
  en: {
    login: 'Your login code is {{codigo}}. Valid for {{minutos}} minutes.',
    register: 'Your verification code is {{codigo}}. Valid for {{minutos}} minutes.',
    password_reset: 'Password reset code: {{codigo}}. Valid for {{minutos}} minutes.',
    transaction: 'Verification code: {{codigo}}. Valid for {{minutos}} minutes.',
    custom: 'Your code is {{codigo}}. Valid for {{minutos}} minutes.',
  },
};

export function getVerificationTemplate(
  purpose: VerificationPurpose,
  locale: VerificationLocale = 'es',
): string {
  return TEMPLATES[locale][purpose];
}

export function buildVerificationMessage(
  purpose: VerificationPurpose,
  code: string,
  opts: {
    locale?: VerificationLocale;
    template?: string;
    expiresInSeconds?: number;
    extraVariables?: Record<string, string | number>;
  } = {},
): string {
  const locale = opts.locale ?? 'es';
  const template = opts.template ?? getVerificationTemplate(purpose, locale);
  const minutes = Math.max(1, Math.round((opts.expiresInSeconds ?? VERIFICATION_DEFAULTS.expiresInSeconds) / 60));
  return renderTemplate(template, {
    codigo: code,
    minutos: minutes,
    ...opts.extraVariables,
  });
}
