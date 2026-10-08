import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';
import path from 'node:path';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';

const PROJECT_ID = 'idea-to-app-grabacion';
let testEnv;

beforeAll(async () => {
  const rules = fs.readFileSync(path.resolve(__dirname, '../firebase/firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: 'localhost',
      port: 8088,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Reglas de Seguridad de Firestore', () => {
  const userAId = 'user_maria_123';
  const userBId = 'user_carlos_456';

  const validGroupData = {
    name: 'Viaje a la Playa',
    ownerId: userAId,
    currency: 'USD',
    participants: [
      { id: 'part_1', name: 'María', isOwner: true },
      { id: 'part_2', name: 'Carlos', isOwner: false },
    ],
  };

  it('Prueba 1: Aislamiento - Usuario B no puede leer ni modificar grupos de Usuario A', async () => {
    // Crear grupo como Usuario A
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', 'grp_1'), validGroupData);
    });

    const userBContext = testEnv.authenticatedContext(userBId);
    const groupRef = doc(userBContext.firestore(), 'groups', 'grp_1');

    await assertFails(getDoc(groupRef));
    await assertFails(setDoc(groupRef, { ...validGroupData, name: 'Hackeado' }));
  });

  it('Prueba 2: Usuario anónimo no puede leer ni escribir datos', async () => {
    const unauthContext = testEnv.unauthenticatedContext();
    const groupRef = doc(unauthContext.firestore(), 'groups', 'grp_anon');

    await assertFails(getDoc(groupRef));
    await assertFails(setDoc(groupRef, validGroupData));
  });

  it('Prueba 3: Rechaza gasto con monto $0 o negativo', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', 'grp_1'), validGroupData);
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const expensesCol = collection(userAContext.firestore(), 'groups/grp_1/expenses');

    // Monto 0
    await assertFails(addDoc(expensesCol, {
      description: 'Gasto cero',
      amount: 0,
      paidById: 'part_1',
      splitType: 'equal',
      splits: [{ participantId: 'part_1' }, { participantId: 'part_2' }],
    }));

    // Monto negativo
    await assertFails(addDoc(expensesCol, {
      description: 'Gasto negativo',
      amount: -25.50,
      paidById: 'part_1',
      splitType: 'equal',
      splits: [{ participantId: 'part_1' }, { participantId: 'part_2' }],
    }));
  });

  it('Prueba 4: Rechaza gasto sin participantes (splits vacío)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', 'grp_1'), validGroupData);
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const expensesCol = collection(userAContext.firestore(), 'groups/grp_1/expenses');

    await assertFails(addDoc(expensesCol, {
      description: 'Gasto fantasma',
      amount: 50.00,
      paidById: 'part_1',
      splitType: 'equal',
      splits: [], // Vacío
    }));
  });

  it('Prueba 5: Rechaza liquidación/pago de una persona hacia sí misma (auto-pago)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', 'grp_1'), validGroupData);
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const settlementsCol = collection(userAContext.firestore(), 'groups/grp_1/settlements');

    await assertFails(addDoc(settlementsCol, {
      fromParticipantId: 'part_1',
      toParticipantId: 'part_1', // Mismo ID
      amount: 20.00,
    }));
  });

  it('Prueba 6: Rechaza liquidación/pago con monto no positivo ($0 o negativo)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', 'grp_1'), validGroupData);
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const settlementsCol = collection(userAContext.firestore(), 'groups/grp_1/settlements');

    await assertFails(addDoc(settlementsCol, {
      fromParticipantId: 'part_2',
      toParticipantId: 'part_1',
      amount: 0,
    }));

    await assertFails(addDoc(settlementsCol, {
      fromParticipantId: 'part_2',
      toParticipantId: 'part_1',
      amount: -10,
    }));
  });

  it('Prueba 7: Rechaza grupo con menos de 2 participantes', async () => {
    const userAContext = testEnv.authenticatedContext(userAId);
    const groupsCol = collection(userAContext.firestore(), 'groups');

    // 0 participantes
    await assertFails(addDoc(groupsCol, {
      name: 'Grupo Solitario',
      ownerId: userAId,
      currency: 'USD',
      participants: [],
    }));

    // 1 participante
    await assertFails(addDoc(groupsCol, {
      name: 'Grupo Individual',
      ownerId: userAId,
      currency: 'USD',
      participants: [{ id: 'part_1', name: 'María' }],
    }));
  });

  it('Prueba 8: Permite operaciones legítimas del dueño del grupo', async () => {
    const userAContext = testEnv.authenticatedContext(userAId);
    const groupRef = doc(userAContext.firestore(), 'groups', 'grp_1');

    // 1. Crear grupo válido
    await assertSucceeds(setDoc(groupRef, validGroupData));

    // 2. Leer grupo
    await assertSucceeds(getDoc(groupRef));

    // 3. Crear gasto válido
    const expensesCol = collection(userAContext.firestore(), 'groups/grp_1/expenses');
    await assertSucceeds(addDoc(expensesCol, {
      description: 'Hospedaje',
      amount: 180.00,
      paidById: 'part_1',
      splitType: 'equal',
      splits: [{ participantId: 'part_1' }, { participantId: 'part_2' }],
    }));

    // 4. Crear pago válido
    const settlementsCol = collection(userAContext.firestore(), 'groups/grp_1/settlements');
    await assertSucceeds(addDoc(settlementsCol, {
      fromParticipantId: 'part_2',
      toParticipantId: 'part_1',
      amount: 45.00,
    }));
  });
});
