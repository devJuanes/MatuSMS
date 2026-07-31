import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { searchQuerySchema } from '@matusms/shared';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import { searchMessages } from '../repositories/messages.js';
import { getBillingUsage } from '../repositories/billing.js';
import {
  handleLemonSqueezyEvent,
  verifyLemonSqueezySignature,
} from '../lib/lemonsqueezy.js';
import { badRequest } from '../lib/errors.js';

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/messages/search', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const query = searchQuerySchema.parse(request.query);
    const result = await searchMessages(user.id, query.q, {
      limit: query.limit,
      offset: query.offset,
    });
    return { data: result };
  });
}

const billingQuery = z.object({
  period: z.string().optional(),
});

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/billing/usage', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { period } = billingQuery.parse(request.query);
    const usage = await getBillingUsage(user.id, period);
    return { data: usage };
  });

  app.get('/v1/users/me/subscription', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    return {
      data: {
        subscription_name: user.subscription_name,
        subscription_id: user.subscription_id,
        subscription_status: user.subscription_status,
        subscription_renews_at: user.subscription_renews_at,
        subscription_ends_at: user.subscription_ends_at,
      },
    };
  });

  app.post('/v1/billing/webhooks/lemonsqueezy', async (request, reply) => {
    const signature = request.headers['x-signature'] as string | undefined;
    const rawBody = JSON.stringify(request.body);
    if (signature && !verifyLemonSqueezySignature(rawBody, signature)) {
      throw badRequest('Invalid webhook signature');
    }
    await handleLemonSqueezyEvent(request.body as Parameters<typeof handleLemonSqueezyEvent>[0]);
    return reply.status(200).send({ received: true });
  });
}
