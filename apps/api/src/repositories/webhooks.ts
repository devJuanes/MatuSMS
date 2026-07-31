import type { CreateWebhookInput, UpdateWebhookInput, Webhook } from '@matusms/shared';
import { deleteRow, getMatuDb, insertRow, nowIso, updateRow } from '../lib/matudb.js';
import { notFound, forbidden } from '../lib/errors.js';
import { generateSigningKey, uuid } from '../lib/utils.js';

export async function listWebhooks(userId: string): Promise<Webhook[]> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Webhook[];
}

export async function findWebhookById(id: string): Promise<Webhook | null> {
  const db = getMatuDb();
  const { data, error } = await db.from('webhooks').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Webhook;
}

export async function createWebhook(userId: string, input: CreateWebhookInput): Promise<Webhook> {
  const now = nowIso();
  const record = {
    id: uuid(),
    user_id: userId,
    url: input.url,
    signing_key: generateSigningKey(),
    phone_numbers: input.phone_numbers ?? [],
    events: input.events ?? [],
    created_at: now,
    updated_at: now,
  };
  return insertRow('webhooks', record as Webhook);
}

export async function updateWebhook(
  id: string,
  userId: string,
  input: UpdateWebhookInput,
): Promise<Webhook> {
  const existing = await findWebhookById(id);
  if (!existing) throw notFound('Webhook not found');
  if (existing.user_id !== userId) throw forbidden();

  await updateRow('webhooks', { id }, { ...input, updated_at: nowIso() });
  const updated = await findWebhookById(id);
  if (!updated) throw new Error('Update failed');
  return updated;
}

export async function deleteWebhook(id: string, userId: string): Promise<void> {
  const existing = await findWebhookById(id);
  if (!existing) throw notFound('Webhook not found');
  if (existing.user_id !== userId) throw forbidden();
  await deleteRow('webhooks', { id });
}

export async function rotateWebhookSigningKey(id: string, userId: string): Promise<Webhook> {
  const existing = await findWebhookById(id);
  if (!existing) throw notFound('Webhook not found');
  if (existing.user_id !== userId) throw forbidden();
  await updateRow('webhooks', { id }, { signing_key: generateSigningKey(), updated_at: nowIso() });
  const updated = await findWebhookById(id);
  if (!updated) throw new Error('Rotate failed');
  return updated;
}
