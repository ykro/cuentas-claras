// Firebase connection. Reads the public web configuration from .env (never hard-coded).
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

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
export const auth = app ? getAuth(app) : null;

/** Calls back with the signed-in user (or null) every time the session changes. */
export function watchSession(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Opens the Google window to sign in. Throws an Error with a message for the user. */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    throw new Error(signInErrorMessage(error?.code));
  }
}

export function signOutUser() {
  return signOut(auth);
}

// Each message says what happened and how to fix it.
function signInErrorMessage(code) {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Cerraste la ventana de Google antes de terminar. Toca "Continuar con Google" otra vez y elige tu cuenta.';
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio y vuelve a intentarlo.';
    case 'auth/unauthorized-domain':
      return 'Esta dirección no está autorizada en Firebase. Abre la app en http://localhost o agrega este dominio en Firebase: Authentication > Configuración > Dominios autorizados.';
    case 'auth/operation-not-allowed':
      return 'El acceso con Google no está activado. Actívalo en Firebase: Authentication > Método de acceso > Google.';
    case 'auth/network-request-failed':
      return 'No hay conexión a internet. Revisa tu conexión y vuelve a intentarlo.';
    default:
      return `No pudimos entrar con Google (${code ?? 'error desconocido'}). Vuelve a intentarlo en unos segundos.`;
  }
}
