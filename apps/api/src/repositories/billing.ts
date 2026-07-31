import type { BillingUsage } from '@matusms/shared';
import { getMatuDb, insertRow, updateRow } from '../lib/matudb.js';

export function currentPeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function incrementBillingUsage(userId: string, count = 1): Promise<void> {
  const period = currentPeriod();
  const db = getMatuDb();
  const { data: existing } = await db
    .from('billing_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('period', period)
    .single();

  if (existing) {
    const row = existing as BillingUsage;
    await updateRow('billing_usage', { user_id: userId, period }, {
      message_count: row.message_count + count,
    });
  } else {
    await insertRow('billing_usage', {
      user_id: userId,
      period,
      message_count: count,
    });
  }
}

export async function getBillingUsage(
  userId: string,
  period?: string,
): Promise<BillingUsage[]> {
  const db = getMatuDb();
  let query = db.from('billing_usage').select('*').eq('user_id', userId);
  if (period) query = query.eq('period', period);
  const { data, error } = await query.order('period', { ascending: false }).limit(12);
  if (error) throw new Error(error.message);
  return (data ?? []) as BillingUsage[];
}

export async function aggregateBillingForPeriod(period: string): Promise<number> {
  const db = getMatuDb();
  const { data } = await db.from('billing_usage').select('*').eq('period', period);
  return (data ?? []).length;
}
