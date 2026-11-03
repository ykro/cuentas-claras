// Balance engine for Cuentas Claras.
// All money is handled in integer cents ($10.00 = 1000) to avoid rounding errors.

/**
 * Splits an amount equally among participants.
 * Leftover cents go one by one to the first participants, so the parts always add up
 * exactly to the total. Example: 1000 among 3 -> 334, 333, 333.
 * @param {number} amountCents
 * @param {string[]} participantIds
 * @returns {Record<string, number>} cents per participant id
 */
export function splitEqually(amountCents, participantIds) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('The amount must be a positive whole number of cents.');
  }
  if (participantIds.length === 0) {
    throw new Error('At least one participant is required.');
  }
  const base = Math.floor(amountCents / participantIds.length);
  const remainder = amountCents % participantIds.length;
  const splits = {};
  participantIds.forEach((id, index) => {
    splits[id] = base + (index < remainder ? 1 : 0);
  });
  return splits;
}

/**
 * Checks that exact amounts add up to the expense total.
 * @param {number} amountCents expense total
 * @param {Record<string, number>} splitsCents cents per participant id
 * @returns {{ ok: boolean, missingCents: number }} missingCents > 0 means something is
 *   still missing; < 0 means the parts exceed the total.
 */
export function checkExactSplits(amountCents, splitsCents) {
  const assigned = Object.values(splitsCents).reduce((sum, cents) => sum + cents, 0);
  const missingCents = amountCents - assigned;
  return { ok: missingCents === 0, missingCents };
}

/**
 * Net balance of each member: positive = others owe them, negative = they owe.
 * Expense: payer +amount, each participant -their share.
 * Payment: whoever handed over the money +amount, whoever received it -amount.
 * @param {string[]} memberIds
 * @param {{ amountCents: number, paidByMemberId: string, splitsCents: Record<string, number> }[]} expenses
 * @param {{ fromMemberId: string, toMemberId: string, amountCents: number }[]} payments
 * @returns {Record<string, number>}
 */
export function computeBalances(memberIds, expenses = [], payments = []) {
  const balances = Object.fromEntries(memberIds.map((id) => [id, 0]));
  const add = (id, cents) => {
    balances[id] = (balances[id] ?? 0) + cents;
  };

  for (const expense of expenses) {
    add(expense.paidByMemberId, expense.amountCents);
    for (const [id, share] of Object.entries(expense.splitsCents)) {
      add(id, -share);
    }
  }
  for (const payment of payments) {
    add(payment.fromMemberId, payment.amountCents);
    add(payment.toMemberId, -payment.amountCents);
  }
  return balances;
}

/**
 * Minimum list of transfers so everyone ends at zero.
 * Repeatedly matches the largest debtor with the largest creditor.
 * Ties keep the member order, so the result is always the same for the same data.
 * @param {Record<string, number>} balances
 * @returns {{ fromMemberId: string, toMemberId: string, amountCents: number }[]}
 */
export function settleUp(balances) {
  const order = Object.keys(balances);
  const byLargest = (a, b) => b.cents - a.cents || order.indexOf(a.id) - order.indexOf(b.id);

  const debtors = order
    .filter((id) => balances[id] < 0)
    .map((id) => ({ id, cents: -balances[id] }));
  const creditors = order
    .filter((id) => balances[id] > 0)
    .map((id) => ({ id, cents: balances[id] }));

  const transfers = [];
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byLargest);
    creditors.sort(byLargest);
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amountCents = Math.min(debtor.cents, creditor.cents);

    transfers.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amountCents });
    debtor.cents -= amountCents;
    creditor.cents -= amountCents;
    if (debtor.cents === 0) debtors.shift();
    if (creditor.cents === 0) creditors.shift();
  }
  return transfers;
}

/**
 * A member can only be removed if no expense or payment mentions them.
 * @param {string} memberId
 * @param {{ paidByMemberId: string, participantIds: string[] }[]} expenses
 * @param {{ fromMemberId: string, toMemberId: string }[]} payments
 * @returns {boolean}
 */
export function canRemoveMember(memberId, expenses = [], payments = []) {
  const inExpense = expenses.some(
    (e) => e.paidByMemberId === memberId || e.participantIds.includes(memberId),
  );
  const inPayment = payments.some(
    (p) => p.fromMemberId === memberId || p.toMemberId === memberId,
  );
  return !inExpense && !inPayment;
}

/**
 * Formats cents as dollars with two decimals: 2000 -> "$20.00", -1900 -> "-$19.00".
 * @param {number} cents
 * @param {{ sign?: boolean }} [options] sign: true adds "+" to positive amounts.
 * @returns {string}
 */
export function formatCents(cents, { sign = false } = {}) {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString('en-US');
  const rest = String(abs % 100).padStart(2, '0');
  const prefix = cents < 0 ? '-' : sign && cents > 0 ? '+' : '';
  return `${prefix}$${dollars}.${rest}`;
}

/**
 * Balance for display with a real minus sign: 10700 -> "+$107.00", -1900 -> "−$19.00", 0 -> "$0.00".
 * @param {number} cents
 * @returns {string}
 */
export function formatBalance(cents) {
  if (cents < 0) return `\u2212${formatCents(-cents)}`;
  return formatCents(cents, { sign: true });
}

/**
 * Converts what the user types ("54", "54.5", "10.99", "$1,200.00") into cents,
 * without floating point. Returns null if it is not a valid amount with up to 2 decimals.
 * @param {string} text
 * @returns {number | null}
 */
export function parseAmountToCents(text) {
  const clean = String(text).trim().replace(/[$,\s]/g, '');
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(clean);
  if (!match) return null;
  const dollars = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  return dollars * 100 + cents;
}

