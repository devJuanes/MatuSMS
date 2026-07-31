import type { UpdateUserInput, User } from '@matusms/shared';
import { env } from '../config.js';
import { deleteRow, generateApiKey, getMatuDb, insertRow, nowIso, updateRow } from '../lib/matudb.js';
import { notFound } from '../lib/errors.js';

export async function findUserById(id: string): Promise<User | null> {
  const db = getMatuDb();
  const { data, error } = await db.from('users').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as User;
}

export async function findUserByApiKey(apiKey: string): Promise<User | null> {
  const db = getMatuDb();
  const { data, error } = await db.from('users').select('*').eq('api_key', apiKey).single();
  if (error || !data) return null;
  return data as User;
}

export async function createUser(id: string, email: string): Promise<User> {
  const now = nowIso();
  const user = {
    id,
    email,
    api_key: generateApiKey(),
    timezone: 'America/New_York',
    active_phone_id: null,
    subscription_name: 'free',
    subscription_id: null,
    subscription_status: null,
    subscription_renews_at: null,
    subscription_ends_at: null,
    notification_message_status_enabled: true,
    notification_webhook_enabled: true,
    notification_heartbeat_enabled: true,
    notification_newsletter_enabled: false,
    created_at: now,
    updated_at: now,
  };
  return insertRow('users', user as User);
}

export async function getOrCreateUser(id: string, email: string): Promise<User> {
  const existing = await findUserById(id);
  if (existing) return existing;
  return createUser(id, email);
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  await updateRow('users', { id }, { ...input, updated_at: nowIso() });
  const updated = await findUserById(id);
  if (!updated) throw notFound('User not found');
  return updated;
}

export async function rotateUserApiKey(id: string): Promise<User> {
  return updateUser(id, { api_key: generateApiKey() } as UpdateUserInput & { api_key: string });
}

export async function deleteUser(id: string): Promise<void> {
  await deleteRow('users', { id });
}

export function isSystemUser(userId: string, apiKey?: string): boolean {
  return userId === env.SYSTEM_USER_ID && apiKey === env.SYSTEM_USER_API_KEY;
}
