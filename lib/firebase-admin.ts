import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function buildServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  throw new Error(
    'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.'
  );
}

function getAdminApp(): App {
  if (!getApps().length) {
    initializeApp({
      credential: cert(buildServiceAccount()),
    });
  }

  return getApps()[0]!;
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
