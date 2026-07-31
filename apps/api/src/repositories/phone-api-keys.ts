import type { PhoneApiKey } from '@matusms/shared';
import { deleteRow, generateApiKey, getMatuDb, insertRow, nowIso } from '../lib/matudb.js';
import { notFound, forbidden } from '../lib/errors.js';
import { uuid } from '../lib/utils.js';
import { findPhoneById } from './phones.js';

export async function listPhoneApiKeys(userId: string): Promise<PhoneApiKey[]> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('phone_api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PhoneApiKey[];
}

export async function findPhoneApiKeyByKey(apiKey: string): Promise<PhoneApiKey | null> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('phone_api_keys')
    .select('*')
    .eq('api_key', apiKey)
    .single();
  if (error || !data) return null;
  return data as PhoneApiKey;
}

export async function createPhoneApiKey(
  userId: string,
  phoneId: string,
): Promise<PhoneApiKey> {
  const phone = await findPhoneById(phoneId);
  if (!phone) throw notFound('Phone not found');
  if (phone.user_id !== userId) throw forbidden();

  const now = nowIso();
  const record = {
    id: uuid(),
    user_id: userId,
    phone_id: phoneId,
    api_key: generateApiKey(),
    created_at: now,
    updated_at: now,
  };
  return insertRow('phone_api_keys', record as PhoneApiKey);
}

export async function getOrCreatePhoneApiKey(
  userId: string,
  phoneId: string,
): Promise<PhoneApiKey> {
  const keys = await listPhoneApiKeys(userId);
  const existing = keys.find((k) => k.phone_id === phoneId);
  if (existing) return existing;
  return createPhoneApiKey(userId, phoneId);
}

export async function deletePhoneApiKey(id: string, userId: string): Promise<void> {
  const db = getMatuDb();
  const { data } = await db.from('phone_api_keys').select('*').eq('id', id).single();
  if (!data) throw notFound('Phone API key not found');
  if ((data as PhoneApiKey).user_id !== userId) throw forbidden();
  await deleteRow('phone_api_keys', { id });
}
