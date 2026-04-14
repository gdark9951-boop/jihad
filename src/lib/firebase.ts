import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Lazy singleton instances
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

function getApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return _app;
}

function getLazyAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getApp());
  _auth.languageCode = 'ar';
  return _auth;
}

function getLazyDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getApp());
  return _db;
}

function getLazyGoogleProvider(): GoogleAuthProvider {
  if (_googleProvider) return _googleProvider;
  _googleProvider = new GoogleAuthProvider();
  return _googleProvider;
}

// Proxy exports - only initialize when actually used at runtime
export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getLazyAuth() as any)[prop];
  },
  set(_target, prop, value) {
    (getLazyAuth() as any)[prop] = value;
    return true;
  },
});

export const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getLazyDb() as any)[prop];
  },
});

export const googleProvider = new Proxy({} as GoogleAuthProvider, {
  get(_target, prop) {
    return (getLazyGoogleProvider() as any)[prop];
  },
});
