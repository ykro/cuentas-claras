import { describe, expect, it } from 'vitest';
import {
  buildExpense,
  emptyExpenseForm,
  equalShareLabel,
  exactProgress,
  exactProgressLabel,
  expenseToForm,
  splitLabel,
} from '../src/lib/expenses.js';

// Test data from specs/03-tareas.md: "Viaje a Antigua".
const members = [
  { id: 'm_1', name: 'Yo' },
  { id: 'm_2', name: 'Carlos' },
  { id: 'm_3', name: 'Beto' },
  { id: 'm_4', name: 'Luisa' },
];
const form = (overrides) => ({ ...emptyExpenseForm(members), ...overrides });
const gasolinaTexts = { m_1: '10', m_2: '10', m_3: '15', m_4: '5' };

describe('Anotar un gasto con tres formas de división (HU-03)', () => {
  it('Hospedaje $180 pagado por Yo entre todos: $45 a cada uno', () => {
    const r = buildExpense(form({ amountText: '180', description: 'Hospedaje' }), members);
    expect(r).toEqual({
      ok: true,
      fields: {
        description: 'Hospedaje',
        amountCents: 18000,
        paidByMemberId: 'm_1',
        splitMode: 'equal_all',
        participantIds: ['m_1', 'm_2', 'm_3', 'm_4'],
        splitsCents: { m_1: 4500, m_2: 4500, m_3: 4500, m_4: 4500 },
      },
    });
  });

  it('Cena del viernes $54 pagada por Carlos sin Beto: $18 a cada uno de los 3', () => {
    const r = buildExpense(
      form({
        amountText: '54',
        description: 'Cena del viernes',
        paidByMemberId: 'm_2',
        splitMode: 'equal_subset',
        selectedIds: ['m_1', 'm_2', 'm_4'],
      }),
      members,
    );
    expect(r.ok).toBe(true);
    expect(r.fields.participantIds).toEqual(['m_1', 'm_2', 'm_4']);
    expect(r.fields.splitsCents).toEqual({ m_1: 1800, m_2: 1800, m_4: 1800 });
  });

  it('Gasolina $40 pagada por Luisa con montos exactos: Yo $10, Carlos $10, Beto $15, Luisa $5', () => {
    const r = buildExpense(
      form({
        amountText: '40',
        description: 'Gasolina',
        paidByMemberId: 'm_4',
        splitMode: 'exact',
        exactTexts: gasolinaTexts,
      }),
      members,
    );
    expect(r.ok).toBe(true);
    expect(r.fields.splitsCents).toEqual({ m_1: 1000, m_2: 1000, m_3: 1500, m_4: 500 });
  });

  it('Gasolina con Luisa en $0: dice "Faltan $5.00" y no se guarda', () => {
    const f = form({
      amountText: '40',
      description: 'Gasolina',
      paidByMemberId: 'm_4',
      splitMode: 'exact',
      exactTexts: { ...gasolinaTexts, m_4: '0' },
    });
    expect(exactProgressLabel(exactProgress(f, members).missingCents)).toBe('Faltan $5.00');
    const r = buildExpense(f, members);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/^Faltan \$5\.00 para llegar a \$40\.00/);
  });

  it('Montos exactos que se pasan dicen cuánto sobra', () => {
    const f = form({ amountText: '40', description: 'Gasolina', splitMode: 'exact', exactTexts: { ...gasolinaTexts, m_1: '12' } });
    expect(exactProgressLabel(exactProgress(f, members).missingCents)).toBe('Sobran $2.00');
    expect(buildExpense(f, members).error).toMatch(/^Sobran \$2\.00/);
  });

  it('Montos exactos que cuadran dicen "Cuadra con el total"', () => {
    const f = form({ amountText: '40', splitMode: 'exact', exactTexts: gasolinaTexts });
    expect(exactProgressLabel(exactProgress(f, members).missingCents)).toBe('Cuadra con el total');
  });

  it('$10.00 entre 3 se reparte $3.34, $3.33, $3.33 y lo anuncia así', () => {
    const r = buildExpense(
      form({ amountText: '10', description: 'Agua', splitMode: 'equal_subset', selectedIds: ['m_1', 'm_2', 'm_3'] }),
      members,
    );
    expect(r.fields.splitsCents).toEqual({ m_1: 334, m_2: 333, m_3: 333 });
    expect(equalShareLabel(1000, 3)).toBe('$3.34 o $3.33 a cada uno');
    expect(equalShareLabel(18000, 4)).toBe('$45.00 a cada uno');
  });

  it('Pide descripción, monto mayor a $0.00 y al menos 1 persona', () => {
    expect(buildExpense(form({ amountText: '10', description: '  ' }), members).error).toMatch(/descripción/);
    expect(buildExpense(form({ amountText: '0', description: 'Chicle' }), members).error).toMatch(/mayor a \$0\.00/);
    expect(buildExpense(form({ amountText: 'abc', description: 'Chicle' }), members).error).toMatch(/mayor a \$0\.00/);
    expect(
      buildExpense(form({ amountText: '1', description: 'Chicle', splitMode: 'equal_subset', selectedIds: [] }), members).error,
    ).toMatch(/al menos 1 persona/);
  });

  it('Un monto exacto mal escrito dice de quién es', () => {
    const r = buildExpense(form({ amountText: '40', description: 'Gasolina', splitMode: 'exact', exactTexts: { m_3: '15.555' } }), members);
    expect(r.error).toMatch(/El monto de Beto no es válido/);
  });
});

describe('Editar un gasto (HU-04)', () => {
  it('Al abrir Gasolina para editar, el formulario trae sus montos exactos', () => {
    const saved = {
      description: 'Gasolina',
      amountCents: 4000,
      paidByMemberId: 'm_4',
      splitMode: 'exact',
      participantIds: ['m_1', 'm_2', 'm_3', 'm_4'],
      splitsCents: { m_1: 1000, m_2: 1000, m_3: 1500, m_4: 500 },
    };
    const f = expenseToForm(saved, members);
    expect(f.amountText).toBe('40.00');
    expect(f.exactTexts).toEqual({ m_1: '10.00', m_2: '10.00', m_3: '15.00', m_4: '5.00' });
    expect(buildExpense(f, members).fields).toEqual(saved);
  });

  it('Gasolina cambiada a $41 sin ajustar montos: avisa que falta $1.00', () => {
    const f = { ...form({ description: 'Gasolina', splitMode: 'exact', exactTexts: gasolinaTexts }), amountText: '41' };
    expect(buildExpense(f, members).error).toMatch(/^Faltan \$1\.00/);
  });
});

describe('Texto de cómo se dividió', () => {
  it('Entre todos, Sin Beto, Montos exactos y Entre Ana y Luis', () => {
    expect(splitLabel({ splitMode: 'equal_all', participantIds: ['m_1', 'm_2', 'm_3', 'm_4'] }, members)).toBe('Entre todos');
    expect(splitLabel({ splitMode: 'equal_subset', participantIds: ['m_1', 'm_2', 'm_4'] }, members)).toBe('Sin Beto');
    expect(splitLabel({ splitMode: 'exact', participantIds: ['m_1'] }, members)).toBe('Montos exactos');
    expect(splitLabel({ splitMode: 'equal_subset', participantIds: ['m_2', 'm_3'] }, members)).toBe('Entre Carlos y Beto');
  });
});

