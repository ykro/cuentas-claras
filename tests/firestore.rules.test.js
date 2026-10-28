import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';
import path from 'node:path';
import { doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';

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

  it('Prueba 9: Bloquea anotar, editar o borrar gastos y pagos en un viaje cerrado', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'groups', 'grp_closed'), {
        ...validGroupData,
        isClosed: true,
        hasPendingDebts: false,
      });
      await setDoc(doc(db, 'groups/grp_closed/expenses', 'exp_1'), {
        description: 'Cena',
        amount: 20.00,
        paidById: 'part_1',
        splitType: 'equal',
        splits: [{ participantId: 'part_1' }, { participantId: 'part_2' }],
      });
      await setDoc(doc(db, 'groups/grp_closed/settlements', 'set_1'), {
        fromParticipantId: 'part_2',
        toParticipantId: 'part_1',
        amount: 10.00,
      });
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const dbA = userAContext.firestore();

    // No puede anotar ni modificar ni borrar gastos
    await assertFails(addDoc(collection(dbA, 'groups/grp_closed/expenses'), {
      description: 'Gasto nuevo en viaje cerrado',
      amount: 15.00,
      paidById: 'part_1',
      splitType: 'equal',
      splits: [{ participantId: 'part_1' }, { participantId: 'part_2' }],
    }));
    await assertFails(updateDoc(doc(dbA, 'groups/grp_closed/expenses', 'exp_1'), {
      amount: 30.00,
    }));
    await assertFails(deleteDoc(doc(dbA, 'groups/grp_closed/expenses', 'exp_1')));

    // No puede registrar ni borrar pagos
    await assertFails(addDoc(collection(dbA, 'groups/grp_closed/settlements'), {
      fromParticipantId: 'part_2',
      toParticipantId: 'part_1',
      amount: 10.00,
    }));
    await assertFails(deleteDoc(doc(dbA, 'groups/grp_closed/settlements', 'set_1')));

    // Tampoco puede editar el nombre del grupo mientras siga cerrado
    await assertFails(updateDoc(doc(dbA, 'groups', 'grp_closed'), {
      name: 'Nombre cambiado estando cerrado',
    }));
  });

  it('Prueba 10: Grupos existentes sin el campo isClosed siguen funcionando igual', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      // Grupo de la v1 sin isClosed ni hasPendingDebts
      await setDoc(doc(context.firestore(), 'groups', 'grp_legacy'), validGroupData);
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const dbA = userAContext.firestore();

    await assertSucceeds(addDoc(collection(dbA, 'groups/grp_legacy/expenses'), {
      description: 'Taxis',
      amount: 20.00,
      paidById: 'part_1',
      splitType: 'equal',
      splits: [{ participantId: 'part_1' }, { participantId: 'part_2' }],
    }));

    await assertSucceeds(addDoc(collection(dbA, 'groups/grp_legacy/settlements'), {
      fromParticipantId: 'part_2',
      toParticipantId: 'part_1',
      amount: 10.00,
    }));

    await assertSucceeds(updateDoc(doc(dbA, 'groups', 'grp_legacy'), {
      name: 'Viaje a la Playa Actualizado',
    }));
  });

  it('Prueba 11: Rechaza cerrar un viaje si alguien todavía debe (hasPendingDebts: true)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', 'grp_debt'), {
        ...validGroupData,
        isClosed: false,
        hasPendingDebts: true,
      });
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const groupRef = doc(userAContext.firestore(), 'groups', 'grp_debt');

    await assertFails(updateDoc(groupRef, { isClosed: true }));
    await assertFails(updateDoc(groupRef, { isClosed: true, hasPendingDebts: false }));
  });

  it('Prueba 12: Solo la dueña puede cerrar un viaje liquidado y volver a reabrirlo', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'groups', 'grp_settled'), {
        ...validGroupData,
        isClosed: false,
        hasPendingDebts: false,
      });
    });

    const userAContext = testEnv.authenticatedContext(userAId);
    const userBContext = testEnv.authenticatedContext(userBId);

    const groupRefA = doc(userAContext.firestore(), 'groups', 'grp_settled');
    const groupRefB = doc(userBContext.firestore(), 'groups', 'grp_settled');

    // Usuario B no puede cerrar el viaje de A
    await assertFails(updateDoc(groupRefB, { isClosed: true }));

    // La dueña A sí puede cerrar el viaje liquidado
    await assertSucceeds(updateDoc(groupRefA, { isClosed: true }));

    // Usuario B no puede reabrir el viaje de A
    await assertFails(updateDoc(groupRefB, { isClosed: false }));

    // La dueña A sí puede reabrir su viaje
    await assertSucceeds(updateDoc(groupRefA, { isClosed: false }));
  });
});
