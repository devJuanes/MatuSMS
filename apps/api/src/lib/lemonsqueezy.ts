import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config.js';
import { nowIso, updateRow } from './matudb.js';

export function verifyLemonSqueezySignature(rawBody: string, signature: string): boolean {
  if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) return env.NODE_ENV === 'development';
  const digest = createHmac('sha256', env.LEMONSQUEEZY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function handleLemonSqueezyEvent(payload: {
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: {
    attributes?: {
      status?: string;
      variant_name?: string;
      renews_at?: string;
      ends_at?: string;
    };
    id?: string;
  };
}): Promise<void> {
  const userId = payload.meta?.custom_data?.user_id;
  if (!userId) return;

  const event = payload.meta?.event_name ?? '';
  const attrs = payload.data?.attributes;

  const updates: Record<string, unknown> = { updated_at: nowIso() };

  if (event.includes('subscription')) {
    updates.subscription_id = payload.data?.id ?? null;
    updates.subscription_status = attrs?.status ?? null;
    updates.subscription_renews_at = attrs?.renews_at ?? null;
    updates.subscription_ends_at = attrs?.ends_at ?? null;
    if (attrs?.variant_name) {
      const name = attrs.variant_name.toLowerCase().replace(/\s+/g, '-');
      updates.subscription_name = name;
    }
  }

  await updateRow('users', { id: userId }, updates);
}
