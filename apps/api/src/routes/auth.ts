import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyTurnstileToken } from '../lib/turnstile.js';
import { badRequest } from '../lib/errors.js';

const turnstileBody = z.object({
  token: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/auth/verify-turnstile', async (request) => {
    const { token } = turnstileBody.parse(request.body);
    const ip = request.ip;
    const valid = await verifyTurnstileToken(token, ip);
    if (!valid) throw badRequest('Turnstile verification failed');
    return { data: { verified: true } };
  });
}
