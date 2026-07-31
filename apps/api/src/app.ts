import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import scalarApiReference from '@scalar/fastify-api-reference';
import { Server as SocketServer } from 'socket.io';
import { env } from './config.js';
import { AppError } from './lib/errors.js';
import { initFirebase } from './lib/firebase.js';
import { connectRedis, isRedisCompatibleWithBullMq } from './lib/redis.js';
import { startWorkers } from './workers/queues.js';
import { ZodError } from 'zod';
import { healthRoutes } from './routes/health.js';
import { userRoutes } from './routes/users.js';
import { phoneRoutes } from './routes/phones.js';
import { messageRoutes } from './routes/messages.js';
import { verificationRoutes } from './routes/verifications.js';
import { phoneApiKeyRoutes } from './routes/phone-api-keys.js';
import { heartbeatRoutes } from './routes/heartbeats.js';
import { webhookRoutes } from './routes/webhooks.js';
import { scheduleRoutes } from './routes/schedules.js';
import { bulkRoutes } from './routes/bulk.js';
import { searchRoutes, billingRoutes } from './routes/search-billing.js';
import { attachmentRoutes } from './routes/attachments.js';
import { authRoutes } from './routes/auth.js';
import { openApiDocument } from './openapi.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(helmet, { contentSecurityPolicy: false });

  // Dio/Flutter often POST with Content-Type: application/json and no body.
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_request, body, done) => {
      const raw = typeof body === 'string' ? body : body.toString('utf8');
      if (raw === '') {
        done(null, {});
        return;
      }
      try {
        done(null, JSON.parse(raw));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return reply.status(400).send({
        error: { message, code: 'VALIDATION_ERROR' },
      });
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { message: error.message, code: error.code },
      });
    }
    app.log.error(error);
    return reply.status(500).send({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    });
  });

  const io = new SocketServer(app.server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;
    if (userId) socket.join(userId);
  });

  await healthRoutes(app);
  await userRoutes(app);
  await phoneRoutes(app);
  await phoneApiKeyRoutes(app);
  await heartbeatRoutes(app);
  await webhookRoutes(app);
  await scheduleRoutes(app);
  await bulkRoutes(app);
  await searchRoutes(app);
  await billingRoutes(app);
  await attachmentRoutes(app);
  await authRoutes(app);
  await messageRoutes(app, io);
  await verificationRoutes(app, io);

  app.get('/openapi.json', async () => openApiDocument);

  await app.register(scalarApiReference, {
    routePrefix: '/docs',
    configuration: {
      title: 'MatuSMS API',
      theme: 'purple',
      url: '/openapi.json',
    },
  });

  return { app, io };
}

export async function startServer() {
  initFirebase();

  try {
    await connectRedis();
    const redisOk = await isRedisCompatibleWithBullMq();
    if (!redisOk) {
      console.warn(
        '[MatuSMS API] Redis < 5.0 detected — BullMQ workers disabled. Use Upstash or Redis 7+ for async SMS/webhooks.',
      );
    } else {
      const workers = startWorkers();
      for (const w of workers) {
        w.on('failed', (job, err) => {
          console.error(`[MatuSMS] Job ${job?.id} failed:`, err.message);
        });
        w.on('error', (err) => {
          console.error('[MatuSMS] Worker error:', err.message);
        });
      }
    }
  } catch (err) {
    console.warn('[MatuSMS API] Redis not available — queue workers disabled:', err);
  }

  const { app } = await buildApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`${env.APP_NAME} API listening on port ${env.PORT}`);
}
