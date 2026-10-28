import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';

const GROUPS_COLLECTION = 'groups';

/**
 * Genera un identificador único seguro para participantes
 */
export function generateParticipantId() {
  return `part_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Crea un nuevo grupo en Firestore con la organizadora y sus participantes.
 */
export async function createGroup({ name, participants, ownerId }) {
  if (!name || !name.trim()) {
    throw new Error('El grupo debe tener un nombre.');
  }

  if (!participants || participants.length < 2) {
    throw new Error('El grupo debe tener al menos dos participantes.');
  }

  const groupData = {
    name: name.trim(),
    ownerId,
    currency: 'USD',
    isClosed: false,
    hasPendingDebts: false,
    participants: participants.map(p => ({
      id: p.id || generateParticipantId(),
      name: p.name.trim(),
      isOwner: Boolean(p.isOwner),
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, GROUPS_COLLECTION), groupData);
  return { id: docRef.id, ...groupData };
}

/**
 * Escucha en tiempo real todos los grupos pertenecientes al usuario actual.
 * Ordena en memoria para no requerir índices compuestos en Firestore.
 */
export function subscribeUserGroups(ownerId, onUpdate, onError) {
  if (!ownerId) return () => {};

  const q = query(
    collection(db, GROUPS_COLLECTION),
    where('ownerId', '==', ownerId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const groups = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Ordenar por fecha de creación descendente
      groups.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      onUpdate(groups);
    },
    (err) => {
      console.error('Error al escuchar grupos:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Escucha un grupo específico en tiempo real.
 */
export function subscribeGroup(groupId, onUpdate, onError) {
  if (!groupId) return () => {};

  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('Error al escuchar grupo:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Actualiza los datos de un grupo (nombre, participantes).
 */
export async function updateGroup(groupId, updateData) {
  if (!groupId) throw new Error('ID de grupo no proporcionado');

  if (updateData.participants && updateData.participants.length < 2) {
    throw new Error('El grupo no puede quedar con menos de dos participantes.');
  }

  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cierra un viaje liquidado (modo solo lectura).
 */
export async function closeGroup(groupId) {
  if (!groupId) throw new Error('ID de grupo no proporcionado');
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(docRef, {
    isClosed: true,
    hasPendingDebts: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reabre un viaje cerrado para volver a editarlo.
 */
export async function reopenGroup(groupId) {
  if (!groupId) throw new Error('ID de grupo no proporcionado');
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(docRef, {
    isClosed: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Elimina un grupo de Firestore.
 */
export async function deleteGroup(groupId) {
  if (!groupId) throw new Error('ID de grupo no proporcionado');
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await deleteDoc(docRef);
}
