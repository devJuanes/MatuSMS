import type {
  Message,
  MessageEventInput,
  MessageStatus,
  MessageThread,
  ReceiveMessageInput,
  SendMessageInput,
} from '@matusms/shared';
import { getMatuDb, insertRow, nowIso, updateRow } from '../lib/matudb.js';
import { notFound, forbidden, badRequest } from '../lib/errors.js';
import { normalizePhoneNumber, uuid } from '../lib/utils.js';
import { findPhoneById } from './phones.js';

export async function findMessageById(id: string): Promise<Message | null> {
  const db = getMatuDb();
  const { data, error } = await db.from('messages').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data as Message;
}

export async function listMessages(
  userId: string,
  opts: { limit?: number; offset?: number; status?: MessageStatus } = {},
): Promise<Message[]> {
  const db = getMatuDb();
  let query = db.from('messages').select('*').eq('user_id', userId);
  if (opts.status) query = query.eq('status', opts.status);
  const { data, error } = await query
    .order('order_timestamp', { ascending: false })
    .limit(opts.limit ?? 50)
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export async function getOutstandingMessages(phoneId: string, userId: string): Promise<Message[]> {
  const db = getMatuDb();
  const phone = await findPhoneById(phoneId);
  if (!phone || phone.user_id !== userId) throw forbidden();

  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .eq('owner', phone.phone_number)
    .in('status', ['pending', 'sending'])
    .eq('can_be_polled', true)
    .order('order_timestamp', { ascending: true })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

async function upsertThread(
  userId: string,
  owner: string,
  contact: string,
  messageId: string,
  content: string,
  unarchive = false,
): Promise<MessageThread> {
  const db = getMatuDb();
  const now = nowIso();

  const { data: existing } = await db
    .from('message_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('owner', owner)
    .eq('contact', contact)
    .single();

  if (existing) {
    const updates: Record<string, unknown> = {
      last_message_id: messageId,
      last_message_content: content,
      order_timestamp: now,
      updated_at: now,
      is_read: false,
    };
    if (unarchive) updates.is_archived = false;

    await updateRow('message_threads', { id: (existing as MessageThread).id }, updates);
    const updated = await db
      .from('message_threads')
      .select('*')
      .eq('id', (existing as MessageThread).id)
      .single();
    if (updated.error || !updated.data) throw new Error(updated.error?.message);
    return updated.data as MessageThread;
  }

  const thread = {
    id: uuid(),
    user_id: userId,
    owner,
    contact,
    is_archived: false,
    is_read: false,
    last_read_at: null,
    color: null,
    status: null,
    last_message_id: messageId,
    last_message_content: content,
    order_timestamp: now,
    created_at: now,
    updated_at: now,
  };
  return insertRow('message_threads', thread as MessageThread);
}

export async function createOutboundMessage(
  userId: string,
  input: SendMessageInput,
  phoneNumber: string,
): Promise<Message> {
  const now = nowIso();
  const contact = normalizePhoneNumber(input.to);
  const status = input.scheduled_send_time ? 'scheduled' : 'pending';

  const message = {
    id: uuid(),
    user_id: userId,
    owner: phoneNumber,
    contact,
    content: input.content,
    attachments: input.attachments ?? [],
    encrypted: input.encrypted ?? false,
    type: 'mobile-terminated' as const,
    status,
    sim: input.sim ?? 'DEFAULT',
    request_id: input.request_id ?? null,
    send_duration: null,
    send_attempt_count: 0,
    max_send_attempts: 2,
    request_received_at: now,
    created_at: now,
    updated_at: now,
    order_timestamp: now,
    last_attempted_at: null,
    scheduled_send_time: input.scheduled_send_time ?? null,
    sent_at: null,
    delivered_at: null,
    expired_at: null,
    failed_at: null,
    received_at: null,
    can_be_polled: true,
  };

  await insertRow('messages', message as Message);

  await upsertThread(userId, phoneNumber, contact, message.id, input.content);
  return message as Message;
}

export async function createInboundMessage(
  userId: string,
  phoneNumber: string,
  input: ReceiveMessageInput,
): Promise<Message> {
  const now = nowIso();
  const contact = normalizePhoneNumber(input.from);
  const receivedAt = input.received_at ?? now;

  const message = {
    id: uuid(),
    user_id: userId,
    owner: phoneNumber,
    contact,
    content: input.content,
    attachments: input.attachments ?? [],
    status: 'received' as const,
    sim: 'DEFAULT',
    request_id: null,
    send_duration: null,
    send_attempt_count: 0,
    max_send_attempts: 0,
    request_received_at: receivedAt,
    created_at: now,
    updated_at: now,
    order_timestamp: receivedAt,
    last_attempted_at: null,
    scheduled_send_time: null,
    sent_at: null,
    delivered_at: null,
    expired_at: null,
    failed_at: null,
    received_at: receivedAt,
    can_be_polled: false,
  };

  await insertRow('messages', message as Message);

  await upsertThread(userId, phoneNumber, contact, message.id, input.content);
  return message as Message;
}

export async function applyMessageEvent(
  messageId: string,
  userId: string,
  event: MessageEventInput,
): Promise<Message> {
  const message = await findMessageById(messageId);
  if (!message) throw notFound('Message not found');
  if (message.user_id !== userId) throw forbidden();

  const now = nowIso();
  const updates: Record<string, unknown> = {
    updated_at: now,
    last_attempted_at: now,
    send_attempt_count: message.send_attempt_count + 1,
  };

  switch (event.event) {
    case 'SENT':
      updates.status = 'sent';
      updates.sent_at = now;
      if (event.send_duration !== undefined) updates.send_duration = event.send_duration;
      break;
    case 'DELIVERED':
      updates.status = 'delivered';
      updates.delivered_at = now;
      break;
    case 'FAILED':
      if (message.send_attempt_count + 1 >= message.max_send_attempts) {
        updates.status = 'failed';
        updates.failed_at = now;
      } else {
        updates.status = 'pending';
        updates.can_be_polled = true;
      }
      break;
    default:
      throw badRequest('Invalid event type');
  }

  await updateRow('messages', { id: messageId }, updates);
  const updated = await findMessageById(messageId);
  if (!updated) throw new Error('Update failed');
  return updated;
}

export async function markMessageSending(messageId: string): Promise<void> {
  await updateRow('messages', { id: messageId }, {
    status: 'sending',
    updated_at: nowIso(),
    can_be_polled: false,
  });
}

export async function expireMessage(messageId: string): Promise<Message | null> {
  const message = await findMessageById(messageId);
  if (!message) return null;
  if (message.status !== 'pending' && message.status !== 'sending') return null;

  const now = nowIso();
  await updateRow('messages', { id: messageId }, {
    status: 'expired',
    expired_at: now,
    updated_at: now,
    can_be_polled: false,
  });
  return { ...message, status: 'expired', expired_at: now, updated_at: now, can_be_polled: false };
}

export async function listThreads(userId: string, archived = false): Promise<MessageThread[]> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('message_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', archived)
    .order('order_timestamp', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as MessageThread[];
}

export async function listThreadMessages(
  userId: string,
  owner: string,
  contact: string,
): Promise<Message[]> {
  const db = getMatuDb();
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .eq('owner', owner)
    .eq('contact', contact)
    .order('order_timestamp', { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export async function searchMessages(
  userId: string,
  query: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ messages: Message[]; threads: MessageThread[] }> {
  const db = getMatuDb();
  const pattern = `%${query}%`;
  const limit = opts.limit ?? 50;

  const [byContent, byContact, threadByContact, threadByContent] = await Promise.all([
    db.from('messages').select('*').eq('user_id', userId).ilike('content', pattern).limit(limit),
    db.from('messages').select('*').eq('user_id', userId).ilike('contact', pattern).limit(limit),
    db.from('message_threads').select('*').eq('user_id', userId).ilike('contact', pattern).limit(limit),
    db
      .from('message_threads')
      .select('*')
      .eq('user_id', userId)
      .ilike('last_message_content', pattern)
      .limit(limit),
  ]);

  const messageMap = new Map<string, Message>();
  for (const row of [...(byContent.data ?? []), ...(byContact.data ?? [])]) {
    messageMap.set((row as Message).id, row as Message);
  }

  const threadMap = new Map<string, MessageThread>();
  for (const row of [...(threadByContact.data ?? []), ...(threadByContent.data ?? [])]) {
    threadMap.set((row as MessageThread).id, row as MessageThread);
  }

  return {
    messages: [...messageMap.values()].slice(0, limit),
    threads: [...threadMap.values()].slice(0, limit),
  };
}

export async function getDueScheduledMessages(): Promise<Message[]> {
  const db = getMatuDb();
  const now = nowIso();
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_send_time', now)
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export async function activateScheduledMessage(messageId: string): Promise<Message | null> {
  const message = await findMessageById(messageId);
  if (!message || message.status !== 'scheduled') return null;

  await updateRow('messages', { id: messageId }, { status: 'pending', updated_at: nowIso() });
  return findMessageById(messageId);
}
