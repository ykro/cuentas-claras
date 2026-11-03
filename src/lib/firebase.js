// Firebase connection. Reads the public web configuration from .env (never hard-coded).
// Sign-in with Google is added in task 4.
import { initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== '',
);

// Only start Firebase when the configuration is complete.
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
