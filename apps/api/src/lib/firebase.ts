import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';
import { env } from '../config.js';

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const raw = readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf-8');
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
