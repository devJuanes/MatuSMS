import type {
  CreateScheduleInput,
  MessageSendSchedule,
  UpdateScheduleInput,
} from '@matusms/shared';
import { deleteRow, getMatuDb, insertRow, nowIso, updateRow } from '../lib/matudb.js';
import { notFound, forbidden } from '../lib/errors.js';
import { uuid } from '../lib/utils.js';

export async function listSchedules(userId: string): Promise<MessageSendSchedule[]> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('message_send_schedules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MessageSendSchedule[];
}

export async function findScheduleById(id: string): Promise<MessageSendSchedule | null> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('message_send_schedules')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as MessageSendSchedule;
}

export async function createSchedule(
  userId: string,
  input: CreateScheduleInput,
): Promise<MessageSendSchedule> {
  const now = nowIso();
  const record = {
    id: uuid(),
    user_id: userId,
    name: input.name,
    timezone: input.timezone,
    windows: input.windows ?? [],
    created_at: now,
    updated_at: now,
  };
  return insertRow('message_send_schedules', record as MessageSendSchedule);
}

export async function updateSchedule(
  id: string,
  userId: string,
  input: UpdateScheduleInput,
): Promise<MessageSendSchedule> {
  const existing = await findScheduleById(id);
  if (!existing) throw notFound('Schedule not found');
  if (existing.user_id !== userId) throw forbidden();

  await updateRow('message_send_schedules', { id }, { ...input, updated_at: nowIso() });
  const updated = await findScheduleById(id);
  if (!updated) throw new Error('Update failed');
  return updated;
}

export async function deleteSchedule(id: string, userId: string): Promise<void> {
  const existing = await findScheduleById(id);
  if (!existing) throw notFound('Schedule not found');
  if (existing.user_id !== userId) throw forbidden();
  await deleteRow('message_send_schedules', { id });
}
