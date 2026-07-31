import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  buildVerificationMessage,
  createVerificationSchema,
  verifyCodeSchema,
  VERIFICATION_DEFAULTS,
} from '@matusms/shared';
import type { Server as SocketServer } from 'socket.io';
import { authenticateUser, requireUser } from '../middleware/auth.js';
import { AppError, badRequest, notFound } from '../lib/errors.js';
import { normalizePhoneNumber } from '../lib/utils.js';
import { createOutboundMessage } from '../repositories/messages.js';
import { listPhonesByUser } from '../repositories/phones.js';
import { findScheduleById } from '../repositories/schedules.js';
import { isWithinSchedule, nextScheduleOpenTime } from '../lib/schedule.js';
import { incrementBillingUsage } from '../repositories/billing.js';
import {
  checkVerificationSendRateLimit,
  getVerificationById,
  newVerificationCode,
  storeVerification,
  verifyVerificationCode,
} from '../repositories/verifications.js';
import { enqueueMessageSend, dispatchWebhook } from '../workers/queues.js';

const idParams = z.object({ id: z.string().uuid() });

async function resolvePhone(
  userId: string,
  activePhoneId: string | null | undefined,
  phoneId?: string,
  from?: string,
) {
  const phones = await listPhonesByUser(userId);
  if (!phones.length) {
    throw badRequest('No hay teléfonos registrados. Vincula un dispositivo Android.');
  }

  let phone = phones[0];
  if (phoneId) {
    const found = phones.find((p) => p.id === phoneId);
    if (!found) throw badRequest('Teléfono no encontrado');
    phone = found;
  } else if (from) {
    const fromNorm = normalizePhoneNumber(from);
    const found = phones.find((p) => normalizePhoneNumber(p.phone_number) === fromNorm);
    if (found) phone = found;
  } else if (activePhoneId) {
    const found = phones.find((p) => p.id === activePhoneId);
    if (found) phone = found;
  }
  return phone;
}

export async function verificationRoutes(
  app: FastifyInstance,
  io?: SocketServer,
): Promise<void> {
  app.post('/v1/verifications', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = createVerificationSchema.parse(request.body);
    const phone = await resolvePhone(user.id, user.active_phone_id, body.phone_id, body.from);
    const to = normalizePhoneNumber(body.to);

    await checkVerificationSendRateLimit(user.id, to);

    const expiresIn = body.expires_in_seconds ?? VERIFICATION_DEFAULTS.expiresInSeconds;
    const code = newVerificationCode(body.code_length);
    const content = buildVerificationMessage(body.purpose, code, {
      locale: body.locale,
      template: body.template,
      expiresInSeconds: expiresIn,
    });

    let sendInput = {
      to,
      content,
      sim: phone.sim,
      request_id: `verification-${body.purpose}`,
    };

    if (phone.message_send_schedule_id) {
      const schedule = await findScheduleById(phone.message_send_schedule_id);
      if (schedule && !isWithinSchedule(schedule)) {
        const next = nextScheduleOpenTime(schedule);
        if (!next) throw badRequest('Fuera de la ventana de envío configurada');
        sendInput = { ...sendInput, scheduled_send_time: next.toISOString() };
      }
    }

    const message = await createOutboundMessage(user.id, sendInput, phone.phone_number);
    const verification = await storeVerification(user.id, body, code, message.id);

    if (!sendInput.scheduled_send_time) {
      await enqueueMessageSend(
        message.id,
        phone.id,
        user.id,
        phone.message_expiration_seconds,
      );
    }

    io?.to(user.id).emit('verification:created', { verification, message });
    await incrementBillingUsage(user.id, 1);
    await dispatchWebhook(user.id, 'verification.sent', {
      verification,
      message,
      purpose: body.purpose,
    });

    return reply.status(202).send({ data: verification });
  });

  app.post('/v1/verifications/verify', { preHandler: authenticateUser }, async (request, reply) => {
    const user = requireUser(request);
    const body = verifyCodeSchema.parse(request.body);
    const result = await verifyVerificationCode(user.id, body.to, body.purpose, body.code);

    if (result.verified) {
      await dispatchWebhook(user.id, 'verification.verified', {
        verification: result.verification,
        purpose: body.purpose,
      });
      return {
        data: {
          verified: true,
          verification_id: result.verification.id,
          purpose: result.verification.purpose,
          to: result.verification.to,
        },
      };
    }

    const event =
      result.reason === 'expired'
        ? 'verification.expired'
        : result.reason === 'max_attempts'
          ? 'verification.failed'
          : 'verification.failed';

    if (result.reason === 'expired' || result.reason === 'max_attempts') {
      await dispatchWebhook(user.id, event, {
        verification: result.verification,
        reason: result.reason,
      });
    }

    const message =
      result.reason === 'expired'
        ? 'El código expiró. Solicita uno nuevo.'
        : result.reason === 'max_attempts'
          ? 'Demasiados intentos fallidos. Solicita un nuevo código.'
          : 'Código incorrecto.';

    throw new AppError(401, message, 'INVALID_CODE');
  });

  app.get('/v1/verifications/:id', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { id } = idParams.parse(request.params);
    const verification = await getVerificationById(user.id, id);
    if (!verification) throw notFound('Verificación no encontrada');
    return { data: verification };
  });
}
