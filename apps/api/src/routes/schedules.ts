import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createScheduleSchema, updateScheduleSchema } from '@matusms/shared';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import {
  createSchedule,
  deleteSchedule,
  findScheduleById,
  listSchedules,
  updateSchedule,
} from '../repositories/schedules.js';
import { notFound } from '../lib/errors.js';

const idParams = z.object({ id: z.string().uuid() });

export async function scheduleRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/schedules', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    return { data: await listSchedules(user.id) };
  });

  app.post('/v1/schedules', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = createScheduleSchema.parse(request.body);
    const schedule = await createSchedule(user.id, body);
    return reply.status(201).send({ data: schedule });
  });

  app.get('/v1/schedules/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const schedule = await findScheduleById(id);
    if (!schedule || schedule.user_id !== user.id) throw notFound('Schedule not found');
    return { data: schedule };
  });

  app.put('/v1/schedules/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const body = updateScheduleSchema.parse(request.body);
    const schedule = await updateSchedule(id, user.id, body);
    return { data: schedule };
  });

  app.delete('/v1/schedules/:id', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    await deleteSchedule(id, user.id);
    return reply.status(204).send();
  });
}
