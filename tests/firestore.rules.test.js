// Security rules tests (plan, section 6.2). They run on the local Firestore emulator:
//   npm run test:rules
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, query, setDoc, updateDoc, where } from 'firebase/firestore';

const A = 'uid_A';
const B = 'uid_B';
const NOW = '2026-11-03T10:30:00Z';
const memberIds = ['m_1', 'm_2', 'm_3', 'm_4'];

const validGroup = (overrides = {}) => ({
  ownerId: A,
  name: 'Viaje a Antigua',
  currency: 'USD',
  memberIds,
  members: [
    { id: 'm_1', name: 'Yo' },
    { id: 'm_2', name: 'Carlos' },
    { id: 'm_3', name: 'Beto' },
    { id: 'm_4', name: 'Luisa' },
  ],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const validExpense = (overrides = {}) => ({
  ownerId: A,
  description: 'Cena del viernes',
  amountCents: 5400,
  paidByMemberId: 'm_2',
  splitMode: 'equal_subset',
  participantIds: ['m_1', 'm_2', 'm_4'],
  splitsCents: { m_1: 1800, m_2: 1800, m_4: 1800 },
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const validPayment = (overrides = {}) => ({
  ownerId: A,
  fromMemberId: 'm_3',
  toMemberId: 'm_1',
  amountCents: 6000,
  createdAt: NOW,
  ...overrides,
});

let env;
const dbAs = (uid) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());

// Seeds group "g1" of uid_A with one expense and one payment (bypassing the rules).
async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'groups/g1'), validGroup());
    await setDoc(doc(db, 'groups/g1/expenses/e1'), validExpense());
    await setDoc(doc(db, 'groups/g1/payments/p1'), validPayment());
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'idea-to-app-grabacion',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

afterAll(async () => {
  await env?.cleanup();
});

describe('1. Sin sesión no se puede leer ni escribir', () => {
  it('rechaza leer y escribir grupos, gastos y pagos', async () => {
    const db = dbAs(null);
    await assertFails(getDoc(doc(db, 'groups/g1')));
    await assertFails(getDoc(doc(db, 'groups/g1/expenses/e1')));
    await assertFails(getDoc(doc(db, 'groups/g1/payments/p1')));
    await assertFails(setDoc(doc(db, 'groups/g2'), validGroup()));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/e2'), validExpense()));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/p2'), validPayment()));
  });
});

describe('2. Aislamiento entre usuarias', () => {
  it('uid_A crea, lee, edita y borra sus grupos, gastos y pagos', async () => {
    const db = dbAs(A);
    await assertSucceeds(setDoc(doc(db, 'groups/g2'), validGroup()));
    await assertSucceeds(getDoc(doc(db, 'groups/g2')));
    await assertSucceeds(updateDoc(doc(db, 'groups/g2'), { name: 'Viaje a Antigua 2', updatedAt: NOW }));
    await assertSucceeds(getDocs(query(collection(db, 'groups'), where('ownerId', '==', A))));

    await assertSucceeds(setDoc(doc(db, 'groups/g1/expenses/e2'), validExpense()));
    await assertSucceeds(getDoc(doc(db, 'groups/g1/expenses/e2')));
    await assertSucceeds(updateDoc(doc(db, 'groups/g1/expenses/e2'), { description: 'Cena', updatedAt: NOW }));
    await assertSucceeds(deleteDoc(doc(db, 'groups/g1/expenses/e2')));

    await assertSucceeds(setDoc(doc(db, 'groups/g1/payments/p2'), validPayment()));
    await assertSucceeds(getDoc(doc(db, 'groups/g1/payments/p2')));
    await assertSucceeds(deleteDoc(doc(db, 'groups/g1/payments/p2')));

    await assertSucceeds(deleteDoc(doc(db, 'groups/g2')));
  });

  it('uid_B no puede leer, editar ni borrar nada de uid_A', async () => {
    const db = dbAs(B);
    await assertFails(getDoc(doc(db, 'groups/g1')));
    await assertFails(getDocs(query(collection(db, 'groups'), where('ownerId', '==', A))));
    await assertFails(updateDoc(doc(db, 'groups/g1'), { name: 'Robado' }));
    await assertFails(deleteDoc(doc(db, 'groups/g1')));

    await assertFails(getDoc(doc(db, 'groups/g1/expenses/e1')));
    await assertFails(updateDoc(doc(db, 'groups/g1/expenses/e1'), { amountCents: 1 }));
    await assertFails(deleteDoc(doc(db, 'groups/g1/expenses/e1')));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/e9'), validExpense({ ownerId: B })));

    await assertFails(getDoc(doc(db, 'groups/g1/payments/p1')));
    await assertFails(deleteDoc(doc(db, 'groups/g1/payments/p1')));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/p9'), validPayment({ ownerId: B })));
  });
});

describe('3. ownerId y createdAt no se pueden cambiar', () => {
  it('uid_A no puede crear documentos a nombre de uid_B', async () => {
    const db = dbAs(A);
    await assertFails(setDoc(doc(db, 'groups/g3'), validGroup({ ownerId: B })));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/e3'), validExpense({ ownerId: B })));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/p3'), validPayment({ ownerId: B })));
  });

  it('uid_A no puede cambiar ownerId ni createdAt de un grupo o gasto', async () => {
    const db = dbAs(A);
    await assertFails(updateDoc(doc(db, 'groups/g1'), { ownerId: B }));
    await assertFails(updateDoc(doc(db, 'groups/g1'), { createdAt: '2020-01-01T00:00:00Z' }));
    await assertFails(updateDoc(doc(db, 'groups/g1/expenses/e1'), { ownerId: B }));
    await assertFails(updateDoc(doc(db, 'groups/g1/expenses/e1'), { createdAt: '2020-01-01T00:00:00Z' }));
  });
});

describe('4. Solo se aceptan grupos válidos', () => {
  it('rechaza grupo sin nombre, nombre de más de 80, moneda distinta, menos de 2 personas o listas desparejas', async () => {
    const db = dbAs(A);
    await assertFails(setDoc(doc(db, 'groups/x1'), validGroup({ name: '' })));
    await assertFails(setDoc(doc(db, 'groups/x2'), validGroup({ name: 'x'.repeat(81) })));
    await assertFails(setDoc(doc(db, 'groups/x3'), validGroup({ currency: 'GTQ' })));
    await assertFails(
      setDoc(doc(db, 'groups/x4'), validGroup({ memberIds: ['m_1'], members: [{ id: 'm_1', name: 'Yo' }] })),
    );
    await assertFails(
      setDoc(doc(db, 'groups/x5'), validGroup({ members: [{ id: 'm_1', name: 'Yo' }, { id: 'm_2', name: 'Carlos' }] })),
    );
    await assertSucceeds(setDoc(doc(db, 'groups/x6'), validGroup({ name: 'x'.repeat(80) })));
  });
});

describe('5. Se rechazan campos extra', () => {
  it('rechaza grupos, gastos y pagos con campos que no están en el esquema', async () => {
    const db = dbAs(A);
    await assertFails(setDoc(doc(db, 'groups/x7'), validGroup({ isAdmin: true })));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/x7'), validExpense({ category: 'comida' })));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/x7'), validPayment({ note: 'efectivo' })));
    await assertFails(updateDoc(doc(db, 'groups/g1'), { memberNames: { m_1: 'Yo' } }));
  });
});

describe('6. Solo se aceptan gastos válidos y de personas del grupo', () => {
  it('rechaza monto 0, negativo o con decimales, sin descripción o con modo inválido', async () => {
    const db = dbAs(A);
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/y1'), validExpense({ amountCents: 0 })));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/y2'), validExpense({ amountCents: -500 })));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/y3'), validExpense({ amountCents: 54.5 })));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/y4'), validExpense({ description: '' })));
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/y5'), validExpense({ splitMode: 'por_cabeza' })));
  });

  it('rechaza ids que no pertenecen al grupo en quién pagó, participantes o reparto', async () => {
    const db = dbAs(A);
    await assertFails(setDoc(doc(db, 'groups/g1/expenses/y6'), validExpense({ paidByMemberId: 'm_99' })));
    await assertFails(
      setDoc(
        doc(db, 'groups/g1/expenses/y7'),
        validExpense({ participantIds: ['m_1', 'm_99'], splitsCents: { m_1: 2700, m_99: 2700 } }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db, 'groups/g1/expenses/y8'),
        validExpense({ participantIds: ['m_1', 'm_2'], splitsCents: { m_1: 2700, m_99: 2700 } }),
      ),
    );
  });
});

describe('7. No se crean gastos ni pagos en un grupo que no existe', () => {
  it('rechaza gastos y pagos dentro de un groupId inexistente', async () => {
    const db = dbAs(A);
    await assertFails(setDoc(doc(db, 'groups/no-existe/expenses/z1'), validExpense()));
    await assertFails(setDoc(doc(db, 'groups/no-existe/payments/z1'), validPayment()));
  });
});

describe('8. Pagos válidos e inmutables', () => {
  it('rechaza pagos a sí mismo, de personas fuera del grupo o con monto 0 o negativo', async () => {
    const db = dbAs(A);
    await assertFails(setDoc(doc(db, 'groups/g1/payments/w1'), validPayment({ toMemberId: 'm_3' })));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/w2'), validPayment({ fromMemberId: 'm_99' })));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/w3'), validPayment({ toMemberId: 'm_99' })));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/w4'), validPayment({ amountCents: 0 })));
    await assertFails(setDoc(doc(db, 'groups/g1/payments/w5'), validPayment({ amountCents: -100 })));
  });

  it('rechaza cualquier edición de un pago ya registrado', async () => {
    const db = dbAs(A);
    await assertFails(updateDoc(doc(db, 'groups/g1/payments/p1'), { amountCents: 1 }));
  });
});

