import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Registra una liquidación / pago entre dos participantes en Firestore
 */
export async function createSettlement(groupId, settlementData) {
  if (!groupId) throw new Error('ID de grupo requerido');

  const amount = Number(settlementData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto del pago debe ser mayor a cero.');
  }

  if (!settlementData.fromParticipantId || !settlementData.toParticipantId) {
    throw new Error('Debe indicarse quién paga y quién recibe.');
  }

  if (settlementData.fromParticipantId === settlementData.toParticipantId) {
    throw new Error('Una persona no puede pagarse a sí misma.');
  }

  const docData = {
    fromParticipantId: settlementData.fromParticipantId,
    toParticipantId: settlementData.toParticipantId,
    amount: parseFloat(amount.toFixed(2)),
    paidAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, 'groups', groupId, 'settlements'), 
    docData
  );

  return { id: docRef.id, ...docData };
}

/**
 * Escucha en tiempo real la subcolección de pagos de un grupo.
 */
export function subscribeSettlements(groupId, onUpdate, onError) {
  if (!groupId) return () => {};

  const colRef = collection(db, 'groups', groupId, 'settlements');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const settlements = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Ordenar cronológicamente (más recientes primero)
      settlements.sort((a, b) => {
        const timeA = a.paidAt?.toMillis ? a.paidAt.toMillis() : (a.paidAt ? new Date(a.paidAt).getTime() : 0);
        const timeB = b.paidAt?.toMillis ? b.paidAt.toMillis() : (b.paidAt ? new Date(b.paidAt).getTime() : 0);
        return timeB - timeA;
      });

      onUpdate(settlements);
    },
    (err) => {
      console.error('Error al escuchar pagos:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Elimina o deshace un pago registrado.
 */
export async function deleteSettlement(groupId, settlementId) {
  if (!groupId || !settlementId) throw new Error('ID de grupo y pago requeridos');
  const docRef = doc(db, 'groups', groupId, 'settlements', settlementId);
  await deleteDoc(docRef);
}
