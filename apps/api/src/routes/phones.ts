import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createPhoneSchema, linkDeviceSchema, updatePhoneSchema } from '@matusms/shared';
import { authenticatePhone, authenticateUser, requirePhoneAuth, requireUser } from '../middleware/auth.js';
import {
  listPhonesByUser,
  createPhone,
  updatePhone,
  deletePhone,
  findPhoneById,
  updatePhoneFcmToken,
  linkDeviceFromApp,
} from '../repositories/phones.js';
import { notFound } from '../lib/errors.js';

const idParams = z.object({ id: z.string().uuid() });
const fcmBody = z.object({ fcm_token: z.string().min(1) });

export async function phoneRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/phones', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const phones = await listPhonesByUser(user.id);
    return { data: phones };
  });

  app.post('/v1/phones', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = createPhoneSchema.parse(request.body);
    const phone = await createPhone(user.id, body);
    return reply.status(201).send({ data: phone });
  });

  app.post('/v1/phones/link-device', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = linkDeviceSchema.parse(request.body);
    const result = await linkDeviceFromApp(user.id, body);
    return reply.status(200).send({ data: result });
  });

  app.get('/v1/phones/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const phone = await findPhoneById(id);
    if (!phone || phone.user_id !== user.id) throw notFound('Phone not found');
    return { data: phone };
  });

  app.put('/v1/phones/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const body = updatePhoneSchema.parse(request.body);
    const phone = await updatePhone(id, user.id, body);
    return { data: phone };
  });

  app.delete('/v1/phones/:id', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    await deletePhone(id, user.id);
    return reply.status(204).send();
  });

  app.put('/v1/phones/me/fcm-token', { preHandler: authenticatePhone }, async (request) => {
    const auth = requirePhoneAuth(request);
    const { fcm_token } = fcmBody.parse(request.body);
    const phone = await updatePhoneFcmToken(auth.phoneId, auth.user.id, fcm_token);
    return { data: phone };
  });

  app.put('/v1/phones/:id/fcm-token', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const { fcm_token } = fcmBody.parse(request.body);
    const phone = await updatePhoneFcmToken(id, user.id, fcm_token);
    return { data: phone };
  });
}
