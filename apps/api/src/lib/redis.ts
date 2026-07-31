import { Redis } from 'ioredis';
import { env } from '../config.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      console.error('[MatuSMS API] Redis error:', err.message);
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (client.status === 'wait') {
    await client.connect();
  }
}

/** BullMQ requires Redis >= 5.0 (Windows legacy installs often ship 3.x). */
export async function isRedisCompatibleWithBullMq(): Promise<boolean> {
  try {
    const client = getRedis();
    if (client.status === 'wait') {
      await client.connect();
    }
    const info = await client.info('server');
    const match = info.match(/redis_version:(\d+)\.(\d+)/);
    if (!match) return false;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    return major > 5 || (major === 5 && minor >= 0);
  } catch {
    return false;
  }
}
