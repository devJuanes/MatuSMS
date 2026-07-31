import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { z } from 'zod';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import { uploadAttachment } from '../lib/attachments.js';
import { badRequest } from '../lib/errors.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function attachmentRoutes(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    limits: { fileSize: MAX_SIZE },
  });

  app.post('/v1/attachments', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const file = await request.file();
    if (!file) throw badRequest('No file uploaded');

    const buffer = await file.toBuffer();
    if (buffer.length > MAX_SIZE) throw badRequest('File too large (max 5MB)');

    const url = await uploadAttachment(
      user.id,
      file.filename,
      buffer,
      file.mimetype,
    );

    return reply.status(201).send({ data: { url, filename: file.filename } });
  });

  app.get('/v1/attachments', { preHandler: authenticateUser }, async () => {
    return {
      data: {
        max_size_bytes: MAX_SIZE,
        allowed_types: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      },
    };
  });
}
