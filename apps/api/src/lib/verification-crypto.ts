import { createHash, randomBytes } from 'node:crypto';

export function generateVerificationCode(length: number): string {
  const digits = '0123456789';
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % 10];
  }
  return code;
}

export function hashVerificationCode(code: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

export function newVerificationSalt(): string {
  return randomBytes(16).toString('hex');
}
