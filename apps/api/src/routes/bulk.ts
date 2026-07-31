import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { bulkSendSchema } from '@matusms/shared';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import { createBulkJob, getBulkJobForUser, listBulkJobs } from '../repositories/bulk-messages.js';
import { bulkProcessQueue } from '../workers/queues.js';

const idParams = z.object({ id: z.string().uuid() });

export async function bulkRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/bulk-messages', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    return { data: await listBulkJobs(user.id) };
  });

  app.get('/v1/bulk-messages/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const job = await getBulkJobForUser(id, user.id);
    return { data: job };
  });

  app.post('/v1/messages/bulk-send', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = bulkSendSchema.parse(request.body);
    const job = await createBulkJob(user.id, {
      requestId: body.request_id,
      filename: body.filename,
      totalCount: body.messages.length,
    });

    await bulkProcessQueue.add('process', {
      bulkId: job.id,
      userId: user.id,
      phoneId: body.phone_id,
      template: body.template,
      messages: body.messages,
    });

    return reply.status(202).send({ data: job });
  });
}
