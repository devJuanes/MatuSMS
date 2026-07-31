import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, authenticatePhone, requirePhoneAuth, requireUser } from '../middleware/auth.js';
import { getMatuDb, insertRow, nowIso, updateRow } from '../lib/matudb.js';
import { uuid } from '../lib/utils.js';
import { dispatchWebhook } from '../workers/queues.js';

const phoneQuery = z.object({ phone_id: z.string().uuid().optional() });

export async function heartbeatRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/heartbeats', { preHandler: authenticatePhone }, async (request) => {
    const auth = requirePhoneAuth(request);
    const db = getMatuDb();
    const now = nowIso();

    const record = {
      id: uuid(),
      phone_id: auth.phoneId,
      user_id: auth.user.id,
      status: 'online' as const,
      created_at: now,
    };

    await insertRow('heartbeats', record);

    try {
      const { data: existing } = await db
        .from('heartbeat_monitors')
        .select('*')
        .eq('phone_id', auth.phoneId)
        .maybeSingle();

      if (existing) {
        await updateRow('heartbeat_monitors', { phone_id: auth.phoneId }, {
          last_seen_at: now,
          status: 'online',
          updated_at: now,
        });
      } else {
        await insertRow('heartbeat_monitors', {
          id: uuid(),
          phone_id: auth.phoneId,
          user_id: auth.user.id,
          last_seen_at: now,
          status: 'online',
          created_at: now,
          updated_at: now,
        });
      }
    } catch (err) {
      request.log.warn({ err }, 'Heartbeat monitor upsert failed');
    }

    try {
      await dispatchWebhook(auth.user.id, 'phone.heartbeat.online', {
        phone_id: auth.phoneId,
        heartbeat: record,
      });
    } catch (err) {
      request.log.warn({ err }, 'Webhook dispatch skipped for heartbeat');
    }

    return { data: record };
  });

  app.get('/v1/heartbeats', { preHandler: authenticatePhone }, async (request) => {
    const auth = requirePhoneAuth(request);
    const db = getMatuDb();
    const { data } = await db
      .from('heartbeats')
      .select('*')
      .eq('phone_id', auth.phoneId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data: data ?? [] };
  });

  app.get('/v1/heartbeats/monitors', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { phone_id } = phoneQuery.parse(request.query);
    const db = getMatuDb();
    let query = db.from('heartbeat_monitors').select('*').eq('user_id', user.id);
    if (phone_id) query = query.eq('phone_id', phone_id);
    const { data } = await query.order('updated_at', { ascending: false });
    return { data: data ?? [] };
  });

  app.get('/v1/heartbeats/history', { preHandler: authenticateUser }, async (request) => {
    const user = requireUser(request);
    const { phone_id } = phoneQuery.parse(request.query);
    const db = getMatuDb();
    let query = db.from('heartbeats').select('*').eq('user_id', user.id);
    if (phone_id) query = query.eq('phone_id', phone_id);
    const { data } = await query.order('created_at', { ascending: false }).limit(100);
    return { data: data ?? [] };
  });
}
