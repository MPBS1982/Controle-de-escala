import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, Firestore, addDoc, serverTimestamp, increment, writeBatch, collectionGroup, setLogLevel, waitForPendingWrites } from 'firebase/firestore';

import firebaseConfig from './firebase-applet-config.json';

type FirebaseRuntimeConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const fallbackConfig = firebaseConfig as FirebaseRuntimeConfig;

const runtimeConfig: FirebaseRuntimeConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId,
};

// Initialize Firebase SDK
const app = initializeApp(runtimeConfig);
setLogLevel('error');
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true,
});
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, addDoc, serverTimestamp, increment, writeBatch, GoogleAuthProvider, collectionGroup, waitForPendingWrites };
export type { FirebaseUser, Firestore };
