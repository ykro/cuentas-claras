// Firebase connection. Reads the public web configuration from .env (never hard-coded).
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

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
export const db = app ? getFirestore(app) : null;

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

// ---------- Groups (Firestore) ----------

const groupsCollection = () => collection(db, 'groups');
const groupDoc = (groupId) => doc(db, 'groups', groupId);
// Every query filters by ownerId: the security rules only allow reading your own documents.
const ownedSubcollection = (uid, groupId, name) =>
  query(collection(db, 'groups', groupId, name), where('ownerId', '==', uid));

/** Live list of the organizer's groups, newest first. */
export function watchGroups(uid, onChange, onError) {
  return onSnapshot(
    query(groupsCollection(), where('ownerId', '==', uid)),
    (snapshot) => {
      const groups = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      groups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onChange(groups);
    },
    (error) => onError(new Error(dataErrorMessage(error.code, 'cargar tus grupos'))),
  );
}

/** Live list of a group's expenses (used for the group's total). */
export function watchExpenses(uid, groupId, onChange, onError) {
  return onSnapshot(
    ownedSubcollection(uid, groupId, 'expenses'),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => onError?.(new Error(dataErrorMessage(error.code, 'cargar los gastos'))),
  );
}

/** Expenses and payments of a group, read once (to know if a person can be removed). */
export async function getGroupMovements(uid, groupId) {
  try {
    const [expenses, payments] = await Promise.all([
      getDocs(ownedSubcollection(uid, groupId, 'expenses')),
      getDocs(ownedSubcollection(uid, groupId, 'payments')),
    ]);
    return {
      expenses: expenses.docs.map((d) => d.data()),
      payments: payments.docs.map((d) => d.data()),
    };
  } catch (error) {
    throw new Error(dataErrorMessage(error.code, 'revisar los movimientos del grupo'));
  }
}

/** @param {{ name: string, members: {id:string,name:string}[], memberIds: string[] }} fields */
export async function createGroup(uid, fields) {
  const now = new Date().toISOString();
  try {
    const ref = await addDoc(groupsCollection(), {
      ownerId: uid,
      name: fields.name,
      currency: 'USD',
      memberIds: fields.memberIds,
      members: fields.members,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  } catch (error) {
    throw new Error(dataErrorMessage(error.code, 'guardar el grupo'));
  }
}

export async function updateGroup(groupId, fields) {
  try {
    await updateDoc(groupDoc(groupId), {
      name: fields.name,
      memberIds: fields.memberIds,
      members: fields.members,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(dataErrorMessage(error.code, 'guardar el grupo'));
  }
}

/** Deletes the group's expenses and payments first, then the group (no orphan data). */
export async function deleteGroup(uid, groupId) {
  try {
    const [expenses, payments] = await Promise.all([
      getDocs(ownedSubcollection(uid, groupId, 'expenses')),
      getDocs(ownedSubcollection(uid, groupId, 'payments')),
    ]);
    const refs = [...expenses.docs, ...payments.docs].map((d) => d.ref);
    // A batch accepts up to 500 writes; the group goes in the last one.
    for (let start = 0; start < refs.length; start += 450) {
      const batch = writeBatch(db);
      refs.slice(start, start + 450).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
    const last = writeBatch(db);
    last.delete(groupDoc(groupId));
    await last.commit();
  } catch (error) {
    throw new Error(dataErrorMessage(error.code, 'borrar el grupo'));
  }
}

// Each message says what happened and how to fix it.
function dataErrorMessage(code, action) {
  switch (code) {
    case 'permission-denied':
      return `Firebase no te dejó ${action}: tu sesión no tiene permiso. Cierra sesión, vuelve a entrar e inténtalo otra vez.`;
    case 'unavailable':
    case 'deadline-exceeded':
      return `No pudimos ${action} porque no hay conexión con Firebase. Revisa tu internet e inténtalo otra vez.`;
    case 'unauthenticated':
      return `Tu sesión se cerró. Vuelve a entrar con Google para ${action}.`;
    default:
      return `No pudimos ${action} (${code ?? 'error desconocido'}). Inténtalo otra vez en unos segundos.`;
  }
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
