import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PhoneApiKey, User } from '@matusms/shared';
import { env } from '../config.js';
import { verifyFirebaseToken } from '../lib/firebase.js';
import { unauthorized } from '../lib/errors.js';
import { findUserByApiKey, getOrCreateUser, isSystemUser } from '../repositories/users.js';
import { findPhoneApiKeyByKey } from '../repositories/phone-api-keys.js';
import { findPhoneById } from '../repositories/phones.js';

export type AuthContext =
  | { type: 'user'; user: User }
  | { type: 'phone'; user: User; phoneApiKey: PhoneApiKey; phoneId: string; phoneNumber: string }
  | { type: 'system'; userId: string };

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

export async function authenticateUser(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string | undefined;
  if (apiKey) {
    const user = await findUserByApiKey(apiKey);
    if (!user) throw unauthorized('Invalid API key');
    request.auth = { type: 'user', user };
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw unauthorized('Missing authentication');
  }

  const token = authHeader.slice(7);
  const { uid, email } = await verifyFirebaseToken(token);
  const user = await getOrCreateUser(uid, email ?? `${uid}@matusms.com`);
  request.auth = { type: 'user', user };
}

export async function authenticatePhone(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string | undefined;
  if (!apiKey) throw unauthorized('Missing phone API key');

  const phoneApiKey = await findPhoneApiKeyByKey(apiKey);
  if (!phoneApiKey) throw unauthorized('Invalid phone API key');

  const phone = await findPhoneById(phoneApiKey.phone_id);
  if (!phone) throw unauthorized('Phone not found');

  const { findUserById } = await import('../repositories/users.js');
  const owner = await findUserById(phoneApiKey.user_id);
  if (!owner) throw unauthorized('User not found');

  request.auth = {
    type: 'phone',
    user: owner,
    phoneApiKey,
    phoneId: phone.id,
    phoneNumber: phone.phone_number,
  };
}

export async function authenticateSystem(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string | undefined;
  const userId = request.headers['x-user-id'] as string | undefined;

  if (!isSystemUser(userId ?? '', apiKey)) {
    throw unauthorized('Invalid system credentials');
  }
  request.auth = { type: 'system', userId: env.SYSTEM_USER_ID };
}

function getUserFromAuth(auth: AuthContext): User {
  if (auth.type === 'user' || auth.type === 'phone') return auth.user;
  throw unauthorized();
}

export function requireUser(request: FastifyRequest): User {
  return getUserFromAuth(request.auth);
}

export function requirePhoneAuth(request: FastifyRequest): Extract<AuthContext, { type: 'phone' }> {
  if (request.auth?.type !== 'phone') throw unauthorized('Phone authentication required');
  return request.auth;
}
