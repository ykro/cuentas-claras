import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Agrega un nuevo gasto a la subcolección groups/{groupId}/expenses
 */
export async function createExpense(groupId, expenseData) {
  if (!groupId) throw new Error('ID de grupo requerido');
  
  const amount = Number(expenseData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto debe ser un número mayor a cero.');
  }

  if (!expenseData.splits || expenseData.splits.length === 0) {
    throw new Error('El gasto debe estar dividido entre al menos una persona.');
  }

  const docData = {
    description: expenseData.description.trim(),
    amount: parseFloat(amount.toFixed(2)),
    paidById: expenseData.paidById,
    splitType: expenseData.splitType || 'equal',
    splits: expenseData.splits,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, 'groups', groupId, 'expenses'), 
    docData
  );

  return { id: docRef.id, ...docData };
}

/**
 * Escucha en tiempo real la subcolección de gastos de un grupo.
 */
export function subscribeExpenses(groupId, onUpdate, onError) {
  if (!groupId) return () => {};

  const colRef = collection(db, 'groups', groupId, 'expenses');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const expenses = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Ordenar cronológicamente (más recientes primero)
      expenses.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      onUpdate(expenses);
    },
    (err) => {
      console.error('Error al escuchar gastos:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Actualiza un gasto existente.
 */
export async function updateExpense(groupId, expenseId, expenseData) {
  if (!groupId || !expenseId) throw new Error('ID de grupo y gasto requeridos');

  const amount = Number(expenseData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto debe ser un número mayor a cero.');
  }

  if (!expenseData.splits || expenseData.splits.length === 0) {
    throw new Error('El gasto debe estar dividido entre al menos una persona.');
  }

  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  await updateDoc(docRef, {
    description: expenseData.description.trim(),
    amount: parseFloat(amount.toFixed(2)),
    paidById: expenseData.paidById,
    splitType: expenseData.splitType || 'equal',
    splits: expenseData.splits,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Elimina un gasto de la subcolección.
 */
export async function deleteExpense(groupId, expenseId) {
  if (!groupId || !expenseId) throw new Error('ID de grupo y gasto requeridos');
  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  await deleteDoc(docRef);
}
