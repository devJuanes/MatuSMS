import type { FastifyInstance } from 'fastify';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import { deleteUser, rotateUserApiKey, updateUser } from '../repositories/users.js';
import { updateUserSchema } from '@matusms/shared';
import { env } from '../config.js';

function publicApiBaseUrl(): string {
  return env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}`;
}

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/users/me', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    return { data: user };
  });

  app.put('/v1/users/me', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const body = updateUserSchema.parse(request.body);
    const updated = await updateUser(user.id, body);
    return { data: updated };
  });

  app.delete('/v1/users/me', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    await deleteUser(user.id);
    return reply.status(204).send();
  });

  app.post('/v1/users/me/api-key/rotate', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const updated = await rotateUserApiKey(user.id);
    return { data: updated };
  });

  app.get('/v1/users/me/link-qr', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const apiBaseUrl = publicApiBaseUrl();
    const payload = JSON.stringify({
      type: 'user_login',
      api_key: user.api_key,
      api_base_url: apiBaseUrl,
    });
    return { data: { payload, api_base_url: apiBaseUrl } };
  });

  app.get('/v1/users/me/notifications', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    return {
      data: {
        message_status: user.notification_message_status_enabled,
        webhook: user.notification_webhook_enabled,
        heartbeat: user.notification_heartbeat_enabled,
        newsletter: user.notification_newsletter_enabled,
      },
    };
  });
}
