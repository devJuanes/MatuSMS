import type { BulkMessage } from '@matusms/shared';
import { getMatuDb, insertRow, nowIso, updateRow } from '../lib/matudb.js';
import { notFound, forbidden } from '../lib/errors.js';
import { uuid } from '../lib/utils.js';

export async function createBulkJob(
  userId: string,
  opts: { requestId?: string; filename?: string; totalCount: number },
): Promise<BulkMessage> {
  const now = nowIso();
  const record = {
    id: uuid(),
    user_id: userId,
    request_id: opts.requestId ?? null,
    filename: opts.filename ?? null,
    status: 'pending' as const,
    total_count: opts.totalCount,
    success_count: 0,
    failed_count: 0,
    created_at: now,
    updated_at: now,
  };
  return insertRow('bulk_messages', record as BulkMessage);
}

export async function findBulkJob(id: string): Promise<BulkMessage | null> {
  const db = getMatuDb();
  const { data, error } = await db.from('bulk_messages').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as BulkMessage;
}

export async function listBulkJobs(userId: string): Promise<BulkMessage[]> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('bulk_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as BulkMessage[];
}

export async function updateBulkJob(
  id: string,
  updates: Partial<Pick<BulkMessage, 'status' | 'success_count' | 'failed_count'>>,
): Promise<BulkMessage> {
  await updateRow('bulk_messages', { id }, { ...updates, updated_at: nowIso() });
  const updated = await findBulkJob(id);
  if (!updated) throw new Error('Update failed');
  return updated;
}

export async function getBulkJobForUser(id: string, userId: string): Promise<BulkMessage> {
  const job = await findBulkJob(id);
  if (!job) throw notFound('Bulk job not found');
  if (job.user_id !== userId) throw forbidden();
  return job;
}
