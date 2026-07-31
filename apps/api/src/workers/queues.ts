import { Queue, Worker, type Job } from 'bullmq';
import { env } from '../config.js';
import { sendFcmDataMessage } from '../lib/firebase.js';
import { findPhoneById, listPhonesByUser, clearPhoneFcmToken } from '../repositories/phones.js';
import {
  activateScheduledMessage,
  createOutboundMessage,
  expireMessage,
  findMessageById,
  getDueScheduledMessages,
} from '../repositories/messages.js';
import { signWebhookPayload } from '../lib/utils.js';
import { getMatuDb, nowIso, updateRow } from '../lib/matudb.js';
import { findUserById } from '../repositories/users.js';
import { updateBulkJob } from '../repositories/bulk-messages.js';
import { incrementBillingUsage } from '../repositories/billing.js';
import type { BulkSendInput, SendMessageInput } from '@matusms/shared';
import { renderTemplate } from '@matusms/shared';
import { msgLog } from '../lib/message-logger.js';

const connection = { url: env.REDIS_URL };

export const messageSendQueue = new Queue('message-send', { connection });
export const messageExpireQueue = new Queue('message-expire-check', { connection });
export const webhookQueue = new Queue('webhook-dispatch', { connection });
export const heartbeatQueue = new Queue('heartbeat-check', { connection });
export const bulkProcessQueue = new Queue('bulk-process', { connection });
export const scheduleDispatchQueue = new Queue('schedule-dispatch', { connection });

export type MessageSendJob = { messageId: string; phoneId: string; userId: string };
export type WebhookJob = {
  userId: string;
  event: string;
  payload: Record<string, unknown>;
  phoneNumber?: string;
};
export type BulkProcessJob = {
  bulkId: string;
  userId: string;
  phoneId?: string;
  template?: string;
  messages: BulkSendInput['messages'];
};

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function startWorkers(): Worker[] {
  const workers: Worker[] = [];

  workers.push(
    new Worker<MessageSendJob>(
      'message-send',
      async (job: Job<MessageSendJob>) => {
        const { messageId, phoneId } = job.data;
        const phone = await findPhoneById(phoneId);
        if (!phone?.fcm_token) {
          msgLog.warn(
            { messageId, phoneId, sim: phone?.sim, phoneNumber: phone?.phone_number },
            'FCM push skipped — no token on phone (app must register FCM; poll fallback active)',
          );
          return;
        }
        try {
          await sendFcmDataMessage(phone.fcm_token, {
            type: 'new_message',
            message_id: messageId,
            sim: phone.sim,
            owner: phone.phone_number,
          });
          msgLog.info(
            { messageId, phoneId, sim: phone.sim },
            'FCM push sent for new message',
          );
        } catch (err) {
          const code = (err as { code?: string }).code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            await clearPhoneFcmToken(phoneId);
            msgLog.warn({ phoneId, messageId, code }, 'FCM token invalid — cleared from phone');
          } else {
            msgLog.error({ err, messageId, phoneId }, 'FCM push failed');
          }
          throw err;
        }
      },
      { connection },
    ),
  );

  workers.push(
    new Worker<{ messageId: string }>(
      'message-expire-check',
      async (job) => {
        const message = await findMessageById(job.data.messageId);
        if (!message) return;
        if (['pending', 'sending'].includes(message.status)) {
          const expired = await expireMessage(job.data.messageId);
          if (expired) {
            await dispatchWebhook(expired.user_id, 'message.send.expired', {
              message: expired,
            }, expired.owner);
          }
        }
      },
      { connection },
    ),
  );

  workers.push(
    new Worker<WebhookJob>(
      'webhook-dispatch',
      async (job) => {
        const { userId, event, payload, phoneNumber } = job.data;
        const user = await findUserById(userId);
        if (!user?.notification_webhook_enabled) return;

        const db = getMatuDb();
        const { data: webhooks } = await db.from('webhooks').select('*').eq('user_id', userId);
        if (!webhooks?.length) return;

        for (const webhook of webhooks) {
          const w = webhook as {
            url: string;
            signing_key: string;
            events: string[];
            phone_numbers: string[];
          };
          if (w.events.length && !w.events.includes(event)) continue;
          if (
            phoneNumber &&
            w.phone_numbers?.length &&
            !w.phone_numbers.includes(phoneNumber)
          ) {
            continue;
          }

          const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
          const signature = signWebhookPayload(body, w.signing_key);

          try {
            await fetch(w.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-MatuSMS-Signature': signature,
                'X-MatuSMS-Event': event,
              },
              body,
            });
          } catch (err) {
            console.error(`[MatuSMS] Webhook failed for ${w.url}:`, err);
          }
        }
      },
      { connection },
    ),
  );

  workers.push(
    new Worker<BulkProcessJob>(
      'bulk-process',
      async (job) => {
        const { bulkId, userId, phoneId, messages, template } = job.data;
        await updateBulkJob(bulkId, { status: 'processing' });

        const phones = await listPhonesByUser(userId);
        if (!phones.length) {
          await updateBulkJob(bulkId, { status: 'failed', failed_count: messages.length });
          return;
        }

        let phone = phones[0];
        if (phoneId) {
          const found = phones.find((p) => p.id === phoneId);
          if (found) phone = found;
        }

        let success = 0;
        let failed = 0;

        for (const item of messages) {
          try {
            let content = item.content?.trim() ?? '';
            if (template) {
              content = renderTemplate(template, item.variables ?? {});
            }
            if (!content) {
              failed++;
              continue;
            }
            const input: SendMessageInput = {
              to: item.to,
              content,
              phone_id: phone.id,
              sim: phone.sim,
            };
            const message = await createOutboundMessage(userId, input, phone.phone_number);
            await enqueueMessageSend(
              message.id,
              phone.id,
              userId,
              phone.message_expiration_seconds,
            );
            await incrementBillingUsage(userId, 1);
            success++;
          } catch {
            failed++;
          }
        }

        await updateBulkJob(bulkId, {
          status: 'completed',
          success_count: success,
          failed_count: failed,
        });
      },
      { connection, limiter: { max: 3, duration: 60_000 } },
    ),
  );

  workers.push(
    new Worker(
      'schedule-dispatch',
      async () => {
        const due = await getDueScheduledMessages();
        for (const msg of due) {
          const activated = await activateScheduledMessage(msg.id);
          if (!activated) continue;
          const phones = await listPhonesByUser(msg.user_id);
          const phone = phones.find((p) => p.phone_number === msg.owner) ?? phones[0];
          if (!phone) continue;
          await enqueueMessageSend(
            activated.id,
            phone.id,
            msg.user_id,
            phone.message_expiration_seconds,
          );
        }
      },
      { connection },
    ),
  );

  workers.push(
    new Worker(
      'heartbeat-check',
      async () => {
        const db = getMatuDb();
        const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS).toISOString();
        const { data: monitors } = await db
          .from('heartbeat_monitors')
          .select('*')
          .eq('status', 'online');

        for (const monitor of monitors ?? []) {
          const m = monitor as {
            phone_id: string;
            user_id: string;
            last_seen_at: string | null;
            status: string;
          };
          if (!m.last_seen_at || m.last_seen_at < cutoff) {
            await updateRow('heartbeat_monitors', { phone_id: m.phone_id }, {
              status: 'offline',
              updated_at: nowIso(),
            });
            await dispatchWebhook(m.user_id, 'phone.heartbeat.offline', {
              phone_id: m.phone_id,
            });
          }
        }
      },
      { connection },
    ),
  );

  scheduleDispatchQueue.add('tick', {}, { repeat: { every: 60_000 } });
  heartbeatQueue.add('check', {}, { repeat: { every: 60_000 } });

  return workers;
}

export async function enqueueMessageSend(
  messageId: string,
  phoneId: string,
  userId: string,
  expirationSeconds: number,
): Promise<void> {
  await messageSendQueue.add('send', { messageId, phoneId, userId });
  await messageExpireQueue.add(
    'expire',
    { messageId },
    { delay: expirationSeconds * 1000 },
  );
  msgLog.info({ messageId, phoneId, userId, expirationSeconds }, 'Message enqueued for delivery');
}

export async function dispatchWebhook(
  userId: string,
  event: string,
  payload: Record<string, unknown>,
  phoneNumber?: string,
): Promise<void> {
  await webhookQueue.add('dispatch', { userId, event, payload, phoneNumber });
}
