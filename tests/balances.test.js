import { describe, expect, it } from 'vitest';
import {
  canRemoveMember,
  checkExactSplits,
  computeBalances,
  formatCents,
  parseAmountToCents,
  settleUp,
  splitEqually,
} from '../src/lib/balances.js';

// Test data from specs/03-tareas.md: "Viaje a Antigua".
const YO = 'm_1';
const CARLOS = 'm_2';
const BETO = 'm_3';
const LUISA = 'm_4';
const members = [YO, CARLOS, BETO, LUISA];

const hospedaje = {
  description: 'Hospedaje',
  amountCents: 18000,
  paidByMemberId: YO,
  splitMode: 'equal_all',
  participantIds: members,
  splitsCents: splitEqually(18000, members),
};
const cena = {
  description: 'Cena del viernes',
  amountCents: 5400,
  paidByMemberId: CARLOS,
  splitMode: 'equal_subset',
  participantIds: [YO, CARLOS, LUISA],
  splitsCents: splitEqually(5400, [YO, CARLOS, LUISA]),
};
const gasolina = {
  description: 'Gasolina',
  amountCents: 4000,
  paidByMemberId: LUISA,
  splitMode: 'exact',
  participantIds: members,
  splitsCents: { [YO]: 1000, [CARLOS]: 1000, [BETO]: 1500, [LUISA]: 500 },
};
const expenses = [hospedaje, cena, gasolina];

const sum = (values) => values.reduce((a, b) => a + b, 0);

describe('Reparto de cada gasto (HU-03)', () => {
  it('Hospedaje $180 entre todos: $45 a cada uno', () => {
    expect(hospedaje.splitsCents).toEqual({ [YO]: 4500, [CARLOS]: 4500, [BETO]: 4500, [LUISA]: 4500 });
  });

  it('Cena del viernes $54 sin Beto: $18 a cada uno de los 3 y nada a Beto', () => {
    expect(cena.splitsCents).toEqual({ [YO]: 1800, [CARLOS]: 1800, [LUISA]: 1800 });
    expect(cena.splitsCents[BETO]).toBeUndefined();
  });

  it('$10.00 entre 3 personas = $3.34, $3.33, $3.33 sin perder ni sobrar un centavo', () => {
    const splits = splitEqually(1000, ['a', 'b', 'c']);
    expect(splits).toEqual({ a: 334, b: 333, c: 333 });
    expect(sum(Object.values(splits))).toBe(1000);
  });

  it('$1.00 entre 3 personas = $0.34, $0.33, $0.33 (suma exacta)', () => {
    expect(splitEqually(100, ['a', 'b', 'c'])).toEqual({ a: 34, b: 33, c: 33 });
  });

  it('Montos exactos de Gasolina $40 cuadran: Yo $10, Carlos $10, Beto $15, Luisa $5', () => {
    expect(checkExactSplits(4000, gasolina.splitsCents)).toEqual({ ok: true, missingCents: 0 });
  });

  it('Montos exactos que no cuadran dicen cuánto falta: Luisa $0 -> faltan $5.00', () => {
    const result = checkExactSplits(4000, { [YO]: 1000, [CARLOS]: 1000, [BETO]: 1500, [LUISA]: 0 });
    expect(result).toEqual({ ok: false, missingCents: 500 });
  });

  it('Montos exactos que se pasan dicen cuánto sobra: -$2.00', () => {
    const result = checkExactSplits(4000, { [YO]: 1200, [CARLOS]: 1000, [BETO]: 1500, [LUISA]: 500 });
    expect(result).toEqual({ ok: false, missingCents: -200 });
  });

  it('Rechaza montos de $0.00 o sin participantes', () => {
    expect(() => splitEqually(0, members)).toThrow();
    expect(() => splitEqually(1000, [])).toThrow();
  });
});

describe('Saldos y mínimo de pagos con los datos de prueba (HU-05)', () => {
  const balances = computeBalances(members, expenses, []);

  it('Total gastado: $274.00', () => {
    expect(sum(expenses.map((e) => e.amountCents))).toBe(27400);
  });

  it('Yo +$107.00, Carlos -$19.00, Beto -$60.00, Luisa -$28.00', () => {
    expect(balances).toEqual({ [YO]: 10700, [CARLOS]: -1900, [BETO]: -6000, [LUISA]: -2800 });
    expect(formatCents(balances[YO], { sign: true })).toBe('+$107.00');
    expect(formatCents(balances[CARLOS])).toBe('-$19.00');
  });

  it('Quién le paga a quién: Beto -> Yo $60.00, Luisa -> Yo $28.00, Carlos -> Yo $19.00', () => {
    expect(settleUp(balances)).toEqual([
      { fromMemberId: BETO, toMemberId: YO, amountCents: 6000 },
      { fromMemberId: LUISA, toMemberId: YO, amountCents: 2800 },
      { fromMemberId: CARLOS, toMemberId: YO, amountCents: 1900 },
    ]);
  });

  it('Lo que reciben los acreedores coincide al centavo con lo que deben los deudores', () => {
    const owed = sum(Object.values(balances).filter((c) => c > 0));
    const owes = -sum(Object.values(balances).filter((c) => c < 0));
    expect(owed).toBe(owes);
    expect(sum(Object.values(balances))).toBe(0);
  });

  it('Ana le debe $10 a Luis y Luis $10 a Carla: un solo pago de Ana a Carla por $10.00', () => {
    const chain = computeBalances(['ana', 'luis', 'carla'], [
      { amountCents: 1000, paidByMemberId: 'luis', participantIds: ['ana'], splitsCents: { ana: 1000 } },
      { amountCents: 1000, paidByMemberId: 'carla', participantIds: ['luis'], splitsCents: { luis: 1000 } },
    ]);
    expect(settleUp(chain)).toEqual([{ fromMemberId: 'ana', toMemberId: 'carla', amountCents: 1000 }]);
  });

  it('Sin gastos todos están a mano y no hay pagos pendientes', () => {
    const empty = computeBalances(members, [], []);
    expect(Object.values(empty).every((c) => c === 0)).toBe(true);
    expect(settleUp(empty)).toEqual([]);
  });

  it('Con centavos impares los pagos sugeridos también cuadran al centavo', () => {
    const odd = computeBalances(['a', 'b', 'c'], [
      { amountCents: 1000, paidByMemberId: 'a', participantIds: ['a', 'b', 'c'], splitsCents: splitEqually(1000, ['a', 'b', 'c']) },
    ]);
    const transfers = settleUp(odd);
    expect(sum(transfers.map((t) => t.amountCents))).toBe(666);
  });
});

describe('Registrar y deshacer pagos (HU-06)', () => {
  it('Beto le paga $60 a Yo: Te deben $47.00, Beto queda a mano y su pago desaparece', () => {
    const payments = [{ fromMemberId: BETO, toMemberId: YO, amountCents: 6000 }];
    const balances = computeBalances(members, expenses, payments);
    expect(balances[YO]).toBe(4700);
    expect(balances[BETO]).toBe(0);
    expect(formatCents(balances[BETO])).toBe('$0.00');
    expect(settleUp(balances)).toEqual([
      { fromMemberId: LUISA, toMemberId: YO, amountCents: 2800 },
      { fromMemberId: CARLOS, toMemberId: YO, amountCents: 1900 },
    ]);
  });

  it('Al deshacer el pago todo vuelve a Te deben $107.00', () => {
    const balances = computeBalances(members, expenses, []);
    expect(balances[YO]).toBe(10700);
  });

  it('Con los 3 pagos hechos todos quedan en $0.00', () => {
    const payments = settleUp(computeBalances(members, expenses, []));
    const balances = computeBalances(members, expenses, payments);
    expect(Object.values(balances).every((c) => c === 0)).toBe(true);
    expect(settleUp(balances)).toEqual([]);
  });
});

describe('Quitar personas del grupo (HU-02)', () => {
  it('No se puede quitar a Beto porque participa en Hospedaje y Gasolina', () => {
    expect(canRemoveMember(BETO, expenses, [])).toBe(false);
  });

  it('No se puede quitar a alguien que solo aparece en un pago', () => {
    const payments = [{ fromMemberId: 'm_5', toMemberId: YO, amountCents: 100 }];
    expect(canRemoveMember('m_5', [], payments)).toBe(false);
  });

  it('Sí se puede quitar a una persona nueva sin gastos ni pagos', () => {
    expect(canRemoveMember('m_5', expenses, [])).toBe(true);
  });
});

describe('Dinero en dólares con dos decimales', () => {
  it('Formatea centavos: $20.00, $0.00, $1,200.50', () => {
    expect(formatCents(2000)).toBe('$20.00');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(120050)).toBe('$1,200.50');
  });

  it('Convierte lo que escribes a centavos sin errores de decimales', () => {
    expect(parseAmountToCents('54')).toBe(5400);
    expect(parseAmountToCents('10.99')).toBe(1099);
    expect(parseAmountToCents('0.1')).toBe(10);
    expect(parseAmountToCents('$1,200.00')).toBe(120000);
    expect(parseAmountToCents('10.999')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('-5')).toBeNull();
  });
});
