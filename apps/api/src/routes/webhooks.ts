import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createWebhookSchema, updateWebhookSchema, webhookEventTypes } from '@matusms/shared';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import {
  createWebhook,
  deleteWebhook,
  findWebhookById,
  listWebhooks,
  rotateWebhookSigningKey,
  updateWebhook,
} from '../repositories/webhooks.js';
import { notFound } from '../lib/errors.js';

const idParams = z.object({ id: z.string().uuid() });

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/webhooks', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    return { data: await listWebhooks(user.id) };
  });

  app.get('/v1/webhooks/events', async () => ({
    data: webhookEventTypes,
  }));

  app.post('/v1/webhooks', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = createWebhookSchema.parse(request.body);
    const webhook = await createWebhook(user.id, body);
    return reply.status(201).send({ data: webhook });
  });

  app.get('/v1/webhooks/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const webhook = await findWebhookById(id);
    if (!webhook || webhook.user_id !== user.id) throw notFound('Webhook not found');
    return { data: webhook };
  });

  app.put('/v1/webhooks/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const body = updateWebhookSchema.parse(request.body);
    const webhook = await updateWebhook(id, user.id, body);
    return { data: webhook };
  });

  app.delete('/v1/webhooks/:id', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    await deleteWebhook(id, user.id);
    return reply.status(204).send();
  });

  app.post('/v1/webhooks/:id/rotate-signing-key', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const webhook = await rotateWebhookSigningKey(id, user.id);
    return { data: webhook };
  });
}
