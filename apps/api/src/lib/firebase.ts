import { readFileSync, existsSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import admin from 'firebase-admin';
import { env } from '../config.js';

let initialized = false;

function resolveServiceAccountPath(configuredPath: string): string {
  if (isAbsolute(configuredPath)) return configuredPath;
  return resolve(process.cwd(), configuredPath);
}

export function initFirebase(): void {
  if (initialized) return;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const path = resolveServiceAccountPath(env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!existsSync(path)) {
      throw new Error(
        `Firebase service account not found at ${path}. ` +
          'Set FIREBASE_SERVICE_ACCOUNT_PATH in apps/api/.env or use FIREBASE_SERVICE_ACCOUNT_JSON.',
      );
    }
    const raw = readFileSync(path, 'utf-8');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (env.NODE_ENV === 'development') {
    console.warn('[MatuSMS API] Firebase not configured — JWT auth disabled in dev');
    return;
  } else {
    throw new Error('Firebase service account required in production');
  }

  initialized = true;
}

export async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string }> {
  if (!initialized) {
    if (env.NODE_ENV === 'development') {
      return { uid: 'dev-user-id', email: 'dev@matusms.com' };
    }
    throw new Error('Firebase not initialized');
  }
  const decoded = await admin.auth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}

export async function sendFcmDataMessage(
  fcmToken: string,
  data: Record<string, string>,
): Promise<void> {
  if (!initialized) {
    console.warn('[MatuSMS API] FCM skipped — Firebase not configured');
    return;
  }
  await admin.messaging().send({
    token: fcmToken,
    data,
    android: { priority: 'high' },
  });
}

export { admin };
