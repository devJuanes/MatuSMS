import type { CreatePhoneInput, LinkDeviceInput, LinkDeviceResponse, Phone, Sim, UpdatePhoneInput } from '@matusms/shared';
import { deleteRow, getMatuDb, insertRow, nowIso, updateRow } from '../lib/matudb.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import { normalizePhoneNumber, uuid } from '../lib/utils.js';
import { getOrCreatePhoneApiKey } from './phone-api-keys.js';

export async function listPhonesByUser(userId: string): Promise<Phone[]> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('phones')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Phone[];
}

export async function findPhoneById(id: string): Promise<Phone | null> {
  const db = getMatuDb();
  const { data, error } = await db.from('phones').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Phone;
}

export async function createPhone(userId: string, input: CreatePhoneInput): Promise<Phone> {
  const now = nowIso();
  const phone = {
    id: uuid(),
    user_id: userId,
    phone_number: normalizePhoneNumber(input.phone_number),
    fcm_token: null,
    messages_per_minute: input.messages_per_minute ?? 1,
    sim: input.sim ?? 'DEFAULT',
    message_send_schedule_id: null,
    max_send_attempts: input.max_send_attempts ?? 2,
    message_expiration_seconds: input.message_expiration_seconds ?? 600,
    missed_call_auto_reply: input.missed_call_auto_reply ?? null,
    unarchive_thread: input.unarchive_thread ?? false,
    created_at: now,
    updated_at: now,
  };
  return insertRow('phones', phone as Phone);
}

export async function updatePhone(
  id: string,
  userId: string,
  input: UpdatePhoneInput,
): Promise<Phone> {
  const phone = await findPhoneById(id);
  if (!phone) throw notFound('Phone not found');
  if (phone.user_id !== userId) throw forbidden();

  const updates: Record<string, unknown> = { ...input, updated_at: nowIso() };
  if (input.phone_number) {
    updates.phone_number = normalizePhoneNumber(input.phone_number);
  }

  await updateRow('phones', { id }, updates);
  const updated = await findPhoneById(id);
  if (!updated) throw new Error('Update failed');
  return updated;
}

export async function updatePhoneFcmToken(
  id: string,
  userId: string,
  fcmToken: string,
): Promise<Phone> {
  const phone = await findPhoneById(id);
  if (!phone) throw notFound('Phone not found');
  if (phone.user_id !== userId) throw forbidden();

  await updateRow('phones', { id }, { fcm_token: fcmToken, updated_at: nowIso() });
  const updated = await findPhoneById(id);
  if (!updated) throw new Error('Update failed');
  return updated;
}

export async function clearPhoneFcmToken(id: string): Promise<void> {
  await updateRow('phones', { id }, { fcm_token: null, updated_at: nowIso() });
}

export async function findPhoneByUserAndSim(userId: string, sim: Sim): Promise<Phone | null> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('phones')
    .select('*')
    .eq('user_id', userId)
    .eq('sim', sim)
    .single();
  if (error || !data) return null;
  return data as Phone;
}

export async function linkDeviceFromApp(
  userId: string,
  input: LinkDeviceInput,
): Promise<LinkDeviceResponse> {
  const slots: Array<{ sim: Sim; number: string }> = [
    { sim: 'SIM1', number: input.sim1_number },
  ];
  const sim2 = input.sim2_number?.trim();
  if (sim2) slots.push({ sim: 'SIM2', number: sim2 });

  const phones: LinkDeviceResponse['phones'] = [];

  for (const slot of slots) {
    let phone = await findPhoneByUserAndSim(userId, slot.sim);
    const normalized = normalizePhoneNumber(slot.number);
    if (phone) {
      if (phone.phone_number !== normalized) {
        phone = await updatePhone(phone.id, userId, { phone_number: normalized });
      }
    } else {
      phone = await createPhone(userId, { phone_number: normalized, sim: slot.sim });
    }

    if (input.fcm_token) {
      phone = await updatePhoneFcmToken(phone.id, userId, input.fcm_token);
    }

    const key = await getOrCreatePhoneApiKey(userId, phone.id);
    phones.push({
      id: phone.id,
      sim: phone.sim,
      phone_number: phone.phone_number,
      api_key: key.api_key,
    });
  }

  if (!phones.length) throw badRequest('At least one SIM number is required');

  return { phones, primary_phone_id: phones[0].id };
}

export async function deletePhone(id: string, userId: string): Promise<void> {
  const phone = await findPhoneById(id);
  if (!phone) throw notFound('Phone not found');
  if (phone.user_id !== userId) throw forbidden();
  await deleteRow('phones', { id });
}
