import { describe, it, expect } from 'vitest';
import { calculateParticipantSplits, calculateBalances, simplifyDebts } from '../src/utils/debtSimplifier.js';
import { formatCurrency, toCents, toDollars } from '../src/utils/formatters.js';

describe('Cálculo de saldos y simplificación de deudas', () => {
  const participants = [
    { id: 'p1', name: 'María' },  // Organizadora
    { id: 'p2', name: 'Carlos' },
    { id: 'p3', name: 'Beto' },
    { id: 'p4', name: 'Luisa' },
  ];

  // Escenario real especificado en specs/03-tareas.md
  const sampleExpenses = [
    {
      id: 'exp1',
      description: 'Hospedaje',
      amount: 180.00,
      paidById: 'p1', // María paga $180
      splitType: 'equal', // Entre los 4 ($45 c/u)
    },
    {
      id: 'exp2',
      description: 'Cena del viernes',
      amount: 54.00,
      paidById: 'p2', // Carlos paga $54
      splitType: 'custom_equal', // Solo María, Carlos y Luisa ($18 c/u, Beto no participó)
      splits: [
        { participantId: 'p1' },
        { participantId: 'p2' },
        { participantId: 'p4' },
      ],
    },
    {
      id: 'exp3',
      description: 'Gasolina',
      amount: 40.00,
      paidById: 'p4', // Luisa paga $40 con montos exactos
      splitType: 'exact',
      splits: [
        { participantId: 'p1', amount: 10.00 },
        { participantId: 'p4', amount: 15.00 },
        { participantId: 'p2', amount: 10.00 },
        { participantId: 'p3', amount: 5.00 },
      ],
    },
  ];

  it('debe calcular los balances netos exactos del escenario de prueba (María +$107.00)', () => {
    const balances = calculateBalances(participants, sampleExpenses);

    const maria = balances.find(b => b.id === 'p1');
    const carlos = balances.find(b => b.id === 'p2');
    const beto = balances.find(b => b.id === 'p3');
    const luisa = balances.find(b => b.id === 'p4');

    // A María le deben exactamente $107.00
    expect(maria.netBalance).toBe(107.00);
    expect(maria.netBalanceCents).toBe(10700);

    // Carlos debe $19.00
    expect(carlos.netBalance).toBe(-19.00);
    expect(carlos.netBalanceCents).toBe(-1900);

    // Beto debe $50.00
    expect(beto.netBalance).toBe(-50.00);
    expect(beto.netBalanceCents).toBe(-5000);

    // Luisa debe $38.00
    expect(luisa.netBalance).toBe(-38.00);
    expect(luisa.netBalanceCents).toBe(-3800);

    // La suma de todos los balances debe ser exactamente $0.00
    const totalSumCents = balances.reduce((sum, b) => sum + b.netBalanceCents, 0);
    expect(totalSumCents).toBe(0);
  });

  it('debe simplificar las transacciones al mínimo de pagos posible', () => {
    const transactions = simplifyDebts(participants, sampleExpenses);

    // En este escenario, 3 deudores le pagan directamente a María (única acreedora)
    expect(transactions).toHaveLength(3);

    expect(transactions).toEqual(
      expect.arrayContaining([
        {
          fromId: 'p3',
          fromName: 'Beto',
          toId: 'p1',
          toName: 'María',
          amount: 50.00,
          amountCents: 5000,
        },
        {
          fromId: 'p4',
          fromName: 'Luisa',
          toId: 'p1',
          toName: 'María',
          amount: 38.00,
          amountCents: 3800,
        },
        {
          fromId: 'p2',
          fromName: 'Carlos',
          toId: 'p1',
          toName: 'María',
          amount: 19.00,
          amountCents: 1900,
        },
      ])
    );
  });

  it('debe actualizar el balance cuando se registra un pago/liquidación', () => {
    // Carlos paga sus $19.00 pendientes a María
    const settlements = [
      {
        id: 'set1',
        fromParticipantId: 'p2',
        toParticipantId: 'p1',
        amount: 19.00,
      },
    ];

    const balances = calculateBalances(participants, sampleExpenses, settlements);
    const carlos = balances.find(b => b.id === 'p2');
    const maria = balances.find(b => b.id === 'p1');

    // Carlos ahora queda al día ($0.00)
    expect(carlos.netBalance).toBe(0);
    expect(carlos.netBalanceCents).toBe(0);

    // A María ahora solo le deben $88.00 (50 de Beto + 38 de Luisa)
    expect(maria.netBalance).toBe(88.00);
    expect(maria.netBalanceCents).toBe(8800);

    // Nuevas transferencias sugeridas solo involucran a Beto y Luisa
    const newTransactions = simplifyDebts(participants, sampleExpenses, settlements);
    expect(newTransactions).toHaveLength(2);
    expect(newTransactions.find(t => t.fromId === 'p2')).toBeUndefined();
  });

  it('debe repartir centavos indivisibles sin perder dinero ($100 entre 3)', () => {
    const threeParticipants = [
      { id: 'u1', name: 'Ana' },
      { id: 'u2', name: 'Bob' },
      { id: 'u3', name: 'Clara' },
    ];

    const expense = {
      id: 'e100',
      amount: 100.00,
      splitType: 'equal',
    };

    const splits = calculateParticipantSplits(expense, threeParticipants);
    expect(splits).toHaveLength(3);

    // 10000 centavos / 3 = 3333 centavos base + 1 centavo sobrante
    const totalSplitsCents = splits.reduce((acc, s) => acc + s.amountCents, 0);
    expect(totalSplitsCents).toBe(10000); // $100.00 exacto
    expect(splits[0].amountCents).toBe(3334); // $33.34
    expect(splits[1].amountCents).toBe(3333); // $33.33
    expect(splits[2].amountCents).toBe(3333); // $33.33
  });

  it('debe formatear moneda correctamente', () => {
    expect(formatCurrency(107)).toBe('$107.00');
    expect(formatCurrency(-19)).toBe('-$19.00');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(10700, true)).toBe('$107.00');
    expect(formatCurrency(-1900, true)).toBe('-$19.00');
  });
});
