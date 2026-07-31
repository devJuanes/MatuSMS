import { createHmac, randomBytes } from 'node:crypto';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

export function normalizePhoneNumber(phone: string): string {
  try {
    const parsed = parsePhoneNumberWithError(phone);
    return parsed.format('E.164');
  } catch {
    if (phone.startsWith('+')) return phone;
    return `+${phone.replace(/\D/g, '')}`;
  }
}

export function generateSigningKey(): string {
  return randomBytes(32).toString('hex');
}

export function signWebhookPayload(payload: string, signingKey: string): string {
  return createHmac('sha256', signingKey).update(payload).digest('hex');
}

export function uuid(): string {
  return crypto.randomUUID();
}
