import { toCents, toDollars } from './formatters.js';

/**
 * Calcula los centavos exactos que le corresponden a cada participante en un gasto,
 * asegurando que la suma coincida al 100% con el monto total (distribución de centavos sobrantes).
 * 
 * @param {Object} expense 
 * @param {Array} allParticipants 
 * @returns {Array<{ participantId: string, amountCents: number }>}
 */
export function calculateParticipantSplits(expense, allParticipants) {
  const totalCents = toCents(expense.amount);
  if (totalCents <= 0) return [];

  if (expense.splitType === 'exact') {
    return (expense.splits || []).map(s => ({
      participantId: s.participantId,
      amountCents: toCents(s.amount),
    }));
  }

  // Si es 'equal', se reparte entre todos los del grupo.
  // Si es 'custom_equal', se reparte entre los seleccionados en expense.splits.
  let targetIds = [];
  if (expense.splitType === 'custom_equal' && expense.splits && expense.splits.length > 0) {
    targetIds = expense.splits.map(s => s.participantId);
  } else {
    targetIds = allParticipants.map(p => p.id);
  }

  const count = targetIds.length;
  if (count === 0) return [];

  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents % count;

  return targetIds.map((participantId, index) => ({
    participantId,
    // Los primeros 'remainderCents' participantes absorben 1 centavo extra para cuadre perfecto
    amountCents: baseCents + (index < remainderCents ? 1 : 0),
  }));
}

/**
 * Calcula el balance neto de cada participante en el grupo considerando gastos y liquidaciones.
 * 
 * Balance = (Total pagado en gastos + Pagos enviados) - (Total consumido en gastos + Pagos recibidos)
 * 
 * @param {Array<{ id: string, name: string }>} participants 
 * @param {Array<Object>} expenses 
 * @param {Array<Object>} settlements 
 * @returns {Array<{ id: string, name: string, paidCents: number, consumedCents: number, netBalanceCents: number, netBalance: number }>}
 */
export function calculateBalances(participants, expenses = [], settlements = []) {
  const participantMap = new Map();

  participants.forEach(p => {
    participantMap.set(p.id, {
      id: p.id,
      name: p.name,
      paidCents: 0,
      consumedCents: 0,
    });
  });

  // Procesar gastos
  expenses.forEach(expense => {
    const totalExpenseCents = toCents(expense.amount);
    
    // Acreditar al que pagó
    if (participantMap.has(expense.paidById)) {
      const payer = participantMap.get(expense.paidById);
      payer.paidCents += totalExpenseCents;
    }

    // Debitar a los que consumieron
    const splits = calculateParticipantSplits(expense, participants);
    splits.forEach(split => {
      if (participantMap.has(split.participantId)) {
        const consumer = participantMap.get(split.participantId);
        consumer.consumedCents += split.amountCents;
      }
    });
  });

  // Procesar liquidaciones / pagos ya registrados
  settlements.forEach(settlement => {
    const settlementCents = toCents(settlement.amount);

    // El deudor que pagó aumenta su saldo a favor (reduce su deuda)
    if (participantMap.has(settlement.fromParticipantId)) {
      const fromP = participantMap.get(settlement.fromParticipantId);
      fromP.paidCents += settlementCents;
    }

    // El acreedor que recibió reduce su saldo a favor
    if (participantMap.has(settlement.toParticipantId)) {
      const toP = participantMap.get(settlement.toParticipantId);
      toP.consumedCents += settlementCents;
    }
  });

  return Array.from(participantMap.values()).map(p => {
    const netBalanceCents = p.paidCents - p.consumedCents;
    return {
      ...p,
      netBalanceCents,
      netBalance: toDollars(netBalanceCents),
    };
  });
}

/**
 * Aplica el algoritmo voraz (Greedy Debt Simplification) para calcular
 * la cantidad mínima de pagos requeridos para liquidar las deudas del grupo.
 * 
 * @param {Array<{ id: string, name: string }>} participants 
 * @param {Array<Object>} expenses 
 * @param {Array<Object>} settlements 
 * @returns {Array<{ fromId: string, fromName: string, toId: string, toName: string, amount: number, amountCents: number }>}
 */
export function simplifyDebts(participants, expenses = [], settlements = []) {
  const balances = calculateBalances(participants, expenses, settlements);

  // Deudores (saldo neto negativo) y Acreedores (saldo neto positivo)
  const debtors = [];
  const creditors = [];

  balances.forEach(b => {
    if (b.netBalanceCents < 0) {
      debtors.push({ id: b.id, name: b.name, cents: -b.netBalanceCents });
    } else if (b.netBalanceCents > 0) {
      creditors.push({ id: b.id, name: b.name, cents: b.netBalanceCents });
    }
  });

  const transactions = [];

  // Ordenar para emparejar a los mayores deudores con los mayores acreedores
  debtors.sort((a, b) => b.cents - a.cents);
  creditors.sort((a, b) => b.cents - a.cents);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const paymentCents = Math.min(debtor.cents, creditor.cents);

    if (paymentCents > 0) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amountCents: paymentCents,
        amount: toDollars(paymentCents),
      });

      debtor.cents -= paymentCents;
      creditor.cents -= paymentCents;
    }

    if (debtor.cents === 0) i++;
    if (creditor.cents === 0) j++;
  }

  return transactions;
}
