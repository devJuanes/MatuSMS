import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import {
  createPhoneApiKey,
  deletePhoneApiKey,
  listPhoneApiKeys,
} from '../repositories/phone-api-keys.js';
import { env } from '../config.js';
import { notFound } from '../lib/errors.js';

const idParams = z.object({ id: z.string().uuid() });
const createBody = z.object({ phone_id: z.string().uuid() });

export async function phoneApiKeyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/phone-api-keys', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const keys = await listPhoneApiKeys(user.id);
    return { data: keys };
  });

  app.post('/v1/phone-api-keys', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const { phone_id } = createBody.parse(request.body);
    const key = await createPhoneApiKey(user.id, phone_id);
    return reply.status(201).send({ data: key });
  });

  app.delete('/v1/phone-api-keys/:id', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    await deletePhoneApiKey(id, user.id);
    return reply.status(204).send();
  });

  app.get('/v1/phone-api-keys/:id/qr', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const keys = await listPhoneApiKeys(user.id);
    const key = keys.find((k) => k.id === id);
    if (!key) throw notFound('Phone API key not found');

    const apiBaseUrl = `http://localhost:${env.PORT}`;
    const qrPayload = JSON.stringify({
      api_key: key.api_key,
      phone_id: key.phone_id,
      api_base_url: apiBaseUrl,
    });

    return { data: { payload: qrPayload, api_base_url: apiBaseUrl } };
  });
}
