import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../services/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Guardar o actualizar perfil en Firestore users/{userId}
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Organizadora',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (err) {
          console.error('Error al sincronizar perfil en Firestore:', err);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error('Error en onAuthStateChanged:', err);
      setError('Ocurrió un error al verificar tu sesión.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana antes de completar el inicio de sesión. Vuelve a intentarlo.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Tu navegador bloqueó la ventana emergente de Google. Permite las ventanas emergentes para continuar.');
      } else {
        setError('No pudimos iniciar sesión con tu cuenta de Google. Inténtalo de nuevo en unos momentos.');
      }
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError('No se pudo cerrar la sesión. Inténtalo de nuevo.');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
