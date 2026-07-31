import { describe, it, expect, beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.MATUDB_URL = process.env.MATUDB_URL ?? 'https://db.matudb.com';
process.env.MATUDB_PROJECT_ID = process.env.MATUDB_PROJECT_ID ?? 'test';
process.env.MATUDB_API_KEY = process.env.MATUDB_API_KEY ?? 'test';

import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

describe('MatuSMS API health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const built = await buildApp();
    app = built.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.service).toBe('MatuSMS API');
    expect(body.status).toBe('ok');
  });

  it('GET /openapi.json returns MatuSMS API spec', async () => {
    const res = await app.inject({ method: 'GET', url: '/openapi.json' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.info.title).toBe('MatuSMS API');
    expect(body.openapi).toBe('3.1.0');
  });

  it('GET /v1/webhooks/events is public', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/webhooks/events' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });
});
