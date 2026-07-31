import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  messageEventSchema,
  messageStatusSchema,
  receiveMessageSchema,
  renderTemplate,
  sendMessageSchema,
} from '@matusms/shared';
import {
  authenticatePhone,
  authenticateUser,
  requirePhoneAuth,
  requireUser,
} from '../middleware/auth.js';
import {
  applyMessageEvent,
  createInboundMessage,
  createOutboundMessage,
  findMessageById,
  getOutstandingMessages,
  listMessages,
  listThreadMessages,
  listThreads,
} from '../repositories/messages.js';
import { listPhonesByUser, findPhoneById } from '../repositories/phones.js';
import { findScheduleById } from '../repositories/schedules.js';
import { isWithinSchedule, nextScheduleOpenTime } from '../lib/schedule.js';
import { badRequest, notFound } from '../lib/errors.js';
import { enqueueMessageSend, dispatchWebhook } from '../workers/queues.js';
import { incrementBillingUsage } from '../repositories/billing.js';
import type { Server as SocketServer } from 'socket.io';

const idParams = z.object({ id: z.string().uuid() });
const listQuery = z.object({
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
  status: messageStatusSchema.optional(),
});
const threadQuery = z.object({ archived: z.coerce.boolean().optional() });
const threadParams = z.object({ owner: z.string(), contact: z.string() });
const missedCallBody = z.object({
  from: z.string(),
  received_at: z.string().datetime().optional(),
});

const eventMap = {
  SENT: 'message.phone.sent',
  DELIVERED: 'message.phone.delivered',
  FAILED: 'message.phone.failed',
} as const;

export async function messageRoutes(
  app: FastifyInstance,
  io?: SocketServer,
): Promise<void> {
  app.post('/v1/messages/send', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = sendMessageSchema.parse(request.body);
    const phones = await listPhonesByUser(user.id);
    if (!phones.length) throw badRequest('No phones registered');

    let phone = phones[0];
    if (body.phone_id) {
      const found = phones.find((p) => p.id === body.phone_id);
      if (!found) throw badRequest('Phone not found');
      phone = found;
    } else if (body.from) {
      const found = phones.find((p) => p.phone_number === body.from);
      if (found) phone = found;
    } else if (user.active_phone_id) {
      const found = phones.find((p) => p.id === user.active_phone_id);
      if (found) phone = found;
    }

    let sendBody = { ...body, sim: body.sim ?? phone.sim };
    if (body.variables && Object.keys(body.variables).length > 0) {
      sendBody = {
        ...sendBody,
        content: renderTemplate(body.content, body.variables),
      };
    }
    if (phone.message_send_schedule_id && !sendBody.scheduled_send_time) {
      const schedule = await findScheduleById(phone.message_send_schedule_id);
      if (schedule && !isWithinSchedule(schedule)) {
        const next = nextScheduleOpenTime(schedule);
        if (!next) throw badRequest('Outside send schedule window');
        sendBody = { ...sendBody, scheduled_send_time: next.toISOString() };
      }
    }

    const message = await createOutboundMessage(user.id, sendBody, phone.phone_number);

    if (!sendBody.scheduled_send_time) {
      await enqueueMessageSend(
        message.id,
        phone.id,
        user.id,
        phone.message_expiration_seconds,
      );
    }

    io?.to(user.id).emit('message:created', { message });
    await incrementBillingUsage(user.id, 1);
    return reply.status(202).send({ data: message });
  });

  app.get('/v1/messages', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const query = listQuery.parse(request.query);
    const messages = await listMessages(user.id, query);
    return { data: messages };
  });

  app.get('/v1/messages/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const message = await findMessageById(id);
    if (!message || message.user_id !== user.id) throw notFound('Message not found');
    return { data: message };
  });

  app.get('/v1/messages/outstanding', { preHandler: authenticatePhone }, async (request) => {
    const auth = requirePhoneAuth(request);
    const messages = await getOutstandingMessages(auth.phoneId, auth.user.id);
    return { data: messages };
  });

  app.post('/v1/messages/:id/events', { preHandler: authenticatePhone }, async (request) => {
    const auth = requirePhoneAuth(request);
    const { id } = idParams.parse(request.params);
    const body = messageEventSchema.parse(request.body);
    const message = await applyMessageEvent(id, auth.user.id, body);
    const webhookEvent = eventMap[body.event];
    await dispatchWebhook(auth.user.id, webhookEvent, { message }, auth.phoneNumber);
    io?.to(auth.user.id).emit('message:updated', { message });
    return { data: message };
  });

  app.post('/v1/messages/receive', { preHandler: authenticatePhone }, async (request) => {
    const auth = requirePhoneAuth(request);
    const body = receiveMessageSchema.parse(request.body);
    const message = await createInboundMessage(auth.user.id, auth.phoneNumber, body);
    await dispatchWebhook(auth.user.id, 'message.phone.received', { message }, auth.phoneNumber);
    io?.to(auth.user.id).emit('message:received', { message });
    await incrementBillingUsage(auth.user.id, 1);
    return { data: message };
  });

  app.post('/v1/messages/call/missed', { preHandler: authenticatePhone }, async (request) => {
    const auth = requirePhoneAuth(request);
    const body = missedCallBody.parse(request.body);
    const phone = await findPhoneById(auth.phoneId);
    const message = await createInboundMessage(auth.user.id, auth.phoneNumber, {
      from: body.from,
      content: '[Missed call]',
      received_at: body.received_at,
    });

    if (phone?.missed_call_auto_reply) {
      await createOutboundMessage(
        auth.user.id,
        { to: body.from, content: phone.missed_call_auto_reply },
        auth.phoneNumber,
      );
    }

    return { data: message };
  });

  app.get('/v1/threads', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { archived } = threadQuery.parse(request.query);
    const threads = await listThreads(user.id, archived ?? false);
    return { data: threads };
  });

  app.get('/v1/threads/:owner/:contact/messages', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { owner, contact } = threadParams.parse(request.params);
    const messages = await listThreadMessages(user.id, owner, contact);
    return { data: messages };
  });
}
