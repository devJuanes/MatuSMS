import { env } from './config.js';

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'MatuSMS API',
    version: '1.0.0',
    description:
      'MatuSMS converts an Android phone into an SMS gateway. Part of the MatuDB ecosystem.',
    contact: {
      name: 'MatuSMS Support',
      email: 'support@matusms.com',
    },
  },
  servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local development' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Phones' },
    { name: 'Messages' },
    { name: 'Threads' },
    { name: 'Webhooks' },
    { name: 'Schedules' },
    { name: 'Bulk' },
    { name: 'Heartbeats' },
    { name: 'Billing' },
    { name: 'Attachments' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/v1/messages/send': {
      post: {
        tags: ['Messages'],
        summary: 'Send SMS (async, 202)',
        security: [{ apiKey: [] }, { bearerAuth: [] }],
        responses: { '202': { description: 'Accepted' } },
      },
    },
    '/v1/messages/outstanding': {
      get: {
        tags: ['Messages'],
        summary: 'Poll outstanding messages (MatuSMS app)',
        security: [{ phoneApiKey: [] }],
        responses: { '200': { description: 'Message list' } },
      },
    },
    '/v1/webhooks': {
      get: { tags: ['Webhooks'], summary: 'List webhooks' },
      post: { tags: ['Webhooks'], summary: 'Create webhook' },
    },
    '/v1/schedules': {
      get: { tags: ['Schedules'], summary: 'List send schedules' },
      post: { tags: ['Schedules'], summary: 'Create schedule' },
    },
    '/v1/messages/bulk-send': {
      post: { tags: ['Bulk'], summary: 'Bulk send CSV/JSON (202)' },
    },
    '/v1/messages/search': {
      get: { tags: ['Messages'], summary: 'Search messages and threads' },
    },
    '/v1/billing/usage': {
      get: { tags: ['Billing'], summary: 'Monthly usage' },
    },
    '/v1/attachments': {
      post: { tags: ['Attachments'], summary: 'Upload attachment (max 5MB)' },
    },
    '/v1/auth/verify-turnstile': {
      post: { tags: ['Auth'], summary: 'Verify Cloudflare Turnstile token' },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      phoneApiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
    },
  },
};
