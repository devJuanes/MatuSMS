import type {
  CreateVerificationInput,
  Verification,
  VerificationPurpose,
  VerificationStatus,
} from '@matusms/shared';
import { VERIFICATION_DEFAULTS } from '@matusms/shared';
import { getRedis } from '../lib/redis.js';
import { normalizePhoneNumber, uuid } from '../lib/utils.js';
import {
  generateVerificationCode,
  hashVerificationCode,
  newVerificationSalt,
} from '../lib/verification-crypto.js';
import { badRequest, forbidden } from '../lib/errors.js';

type StoredVerification = {
  id: string;
  user_id: string;
  to: string;
  purpose: VerificationPurpose;
  status: VerificationStatus;
  locale: string;
  message_id: string | null;
  salt: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
};

function redisKey(userId: string, purpose: VerificationPurpose, to: string): string {
  const phone = normalizePhoneNumber(to);
  return `verification:${userId}:${purpose}:${phone}`;
}

function rateKey(userId: string, to: string): string {
  const phone = normalizePhoneNumber(to);
  return `verification:rate:${userId}:${phone}`;
}

function toPublicVerification(row: StoredVerification): Verification {
  return {
    id: row.id,
    user_id: row.user_id,
    to: row.to,
    purpose: row.purpose,
    status: row.status,
    locale: row.locale as Verification['locale'],
    message_id: row.message_id,
    expires_at: row.expires_at,
    verified_at: row.verified_at,
    created_at: row.created_at,
    metadata: row.metadata,
  };
}

export async function checkVerificationSendRateLimit(userId: string, to: string): Promise<void> {
  const redis = getRedis();
  const rate = rateKey(userId, to);
  const sends = await redis.incr(rate);
  if (sends === 1) {
    await redis.expire(rate, VERIFICATION_DEFAULTS.sendWindowSeconds);
  }
  if (sends > VERIFICATION_DEFAULTS.maxSendsPerWindow) {
    throw badRequest(
      'Demasiados códigos enviados a este número. Espera unos minutos antes de reintentar.',
    );
  }
}

export function newVerificationCode(length?: number): string {
  return generateVerificationCode(length ?? VERIFICATION_DEFAULTS.codeLength);
}

export async function storeVerification(
  userId: string,
  input: CreateVerificationInput,
  code: string,
  messageId: string,
): Promise<Verification> {
  const redis = getRedis();
  const to = normalizePhoneNumber(input.to);
  const purpose = input.purpose;
  const expiresIn = input.expires_in_seconds ?? VERIFICATION_DEFAULTS.expiresInSeconds;
  const key = redisKey(userId, purpose, to);
  const salt = newVerificationSalt();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);
  const id = uuid();

  const row: StoredVerification = {
    id,
    user_id: userId,
    to,
    purpose,
    status: 'pending',
    locale: input.locale ?? 'es',
    message_id: messageId,
    salt,
    code_hash: hashVerificationCode(code, salt),
    attempts: 0,
    expires_at: expiresAt.toISOString(),
    verified_at: null,
    created_at: now.toISOString(),
    metadata: input.metadata,
  };

  await redis.setex(key, expiresIn, JSON.stringify(row));
  await redis.setex(`verification:id:${id}`, expiresIn, JSON.stringify(row));
  return toPublicVerification(row);
}

export async function getVerificationById(
  userId: string,
  id: string,
): Promise<Verification | null> {
  const redis = getRedis();
  const raw = await redis.get(`verification:id:${id}`);
  if (!raw) return null;
  const row = JSON.parse(raw) as StoredVerification;
  if (row.user_id !== userId) return null;
  return toPublicVerification(row);
}

export async function verifyVerificationCode(
  userId: string,
  to: string,
  purpose: VerificationPurpose,
  code: string,
): Promise<{ verified: boolean; verification: Verification; reason?: string }> {
  const redis = getRedis();
  const phone = normalizePhoneNumber(to);
  const key = redisKey(userId, purpose, phone);
  const raw = await redis.get(key);
  if (!raw) {
    throw badRequest('No hay un código activo para este número y purpose. Solicita uno nuevo.');
  }

  const row = JSON.parse(raw) as StoredVerification;
  if (row.user_id !== userId) throw forbidden();

  const now = Date.now();
  const expiresAt = new Date(row.expires_at).getTime();
  if (now > expiresAt || row.status === 'expired') {
    row.status = 'expired';
    await redis.del(key);
    await redis.del(`verification:id:${row.id}`);
    return { verified: false, verification: toPublicVerification(row), reason: 'expired' };
  }

  if (row.status === 'verified') {
    return { verified: true, verification: toPublicVerification(row) };
  }

  row.attempts += 1;
  const hash = hashVerificationCode(code.trim(), row.salt);
  const match = hash === row.code_hash;

  if (match) {
    row.status = 'verified';
    row.verified_at = new Date().toISOString();
    const ttl = Math.max(60, Math.ceil((expiresAt - now) / 1000));
    await redis.setex(key, ttl, JSON.stringify(row));
    await redis.setex(`verification:id:${row.id}`, ttl, JSON.stringify(row));
    return { verified: true, verification: toPublicVerification(row) };
  }

  if (row.attempts >= VERIFICATION_DEFAULTS.maxAttempts) {
    row.status = 'failed';
    await redis.del(key);
    await redis.del(`verification:id:${row.id}`);
    return { verified: false, verification: toPublicVerification(row), reason: 'max_attempts' };
  }

  const ttl = Math.max(60, Math.ceil((expiresAt - now) / 1000));
  await redis.setex(key, ttl, JSON.stringify(row));
  await redis.setex(`verification:id:${row.id}`, ttl, JSON.stringify(row));
  return { verified: false, verification: toPublicVerification(row), reason: 'invalid_code' };
}
