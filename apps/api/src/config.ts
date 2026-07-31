import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  APP_NAME: z.string().default('MatuSMS'),
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MATUDB_URL: z.string().url(),
  MATUDB_PROJECT_ID: z.string().min(1),
  MATUDB_API_KEY: z.string().min(1),
  MATUDB_USE_SUPABASE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  SYSTEM_USER_ID: z.string().default('system-user-id'),
  SYSTEM_USER_API_KEY: z.string().default('system-user-api-key'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('system@matusms.com'),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  ATTACHMENTS_BUCKET: z.string().default('matusms-attachments'),
  API_PUBLIC_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    return envSchema.parse({
      ...process.env,
      MATUDB_URL: process.env.MATUDB_URL ?? 'https://db.matudb.com',
      MATUDB_PROJECT_ID: process.env.MATUDB_PROJECT_ID ?? 'test',
      MATUDB_API_KEY: process.env.MATUDB_API_KEY ?? 'test',
    });
  }
  return parsed.data;
}

export const env = loadEnv();
