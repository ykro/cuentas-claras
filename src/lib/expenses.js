// Pure helpers for expenses (no Firebase here, so they can be tested).
import { checkExactSplits, formatCents, parseAmountToCents, splitEqually } from './balances.js';

export const MAX_DESCRIPTION = 140;
export const MAX_AMOUNT_CENTS = 100000000; // $1,000,000.00, same limit as firestore.rules

export const SPLIT_MODE_LABELS = {
  equal_all: 'Partes iguales (todos)',
  equal_subset: 'Solo algunos',
  exact: 'Montos exactos',
};

/** 5400 -> "54.00" (to prefill an input, without "$"). */
export function centsToInput(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

/** Empty form for a new expense. The organizer (first person) paid by default. */
export function emptyExpenseForm(members) {
  return {
    amountText: '',
    description: '',
    paidByMemberId: members[0]?.id ?? '',
    splitMode: 'equal_all',
    selectedIds: members.map((m) => m.id),
    exactTexts: {},
  };
}

/** Form prefilled with a saved expense (to edit it). */
export function expenseToForm(expense, members) {
  const exactTexts = {};
  if (expense.splitMode === 'exact') {
    for (const [id, cents] of Object.entries(expense.splitsCents)) exactTexts[id] = centsToInput(cents);
  }
  return {
    amountText: centsToInput(expense.amountCents),
    description: expense.description,
    paidByMemberId: expense.paidByMemberId,
    splitMode: expense.splitMode,
    selectedIds:
      expense.splitMode === 'equal_subset' ? [...expense.participantIds] : members.map((m) => m.id),
    exactTexts,
  };
}

/**
 * How far the exact amounts are from the total, for the live message.
 * @returns {{ missingCents: number } | null} null if the total or an amount is not valid yet.
 */
export function exactProgress(form, members) {
  const amountCents = parseAmountToCents(form.amountText);
  if (amountCents === null || amountCents <= 0) return null;
  const splits = {};
  for (const m of members) {
    const text = (form.exactTexts[m.id] ?? '').trim();
    const cents = text === '' ? 0 : parseAmountToCents(text);
    if (cents === null) return null;
    splits[m.id] = cents;
  }
  return { missingCents: checkExactSplits(amountCents, splits).missingCents };
}

/** "Faltan $5.00" / "Sobran $2.00" / "Cuadra con el total" */
export function exactProgressLabel(missingCents) {
  if (missingCents > 0) return `Faltan ${formatCents(missingCents)}`;
  if (missingCents < 0) return `Sobran ${formatCents(-missingCents)}`;
  return 'Cuadra con el total';
}

/** "$45.00 a cada uno" or "$3.34 o $3.33 a cada uno" */
export function equalShareLabel(amountCents, count) {
  if (!amountCents || amountCents <= 0 || count === 0) return '';
  const low = Math.floor(amountCents / count);
  if (amountCents % count === 0) return `${formatCents(low)} a cada uno`;
  return `${formatCents(low + 1)} o ${formatCents(low)} a cada uno`;
}

/**
 * Validates the form and returns the fields to save (in cents).
 * @returns {{ ok: true, fields: object } | { ok: false, error: string }}
 */
export function buildExpense(form, members) {
  const amountCents = parseAmountToCents(form.amountText);
  if (amountCents === null || amountCents <= 0) {
    return { ok: false, error: 'Escribe un monto mayor a $0.00, por ejemplo 54 o 54.50.' };
  }
  if (amountCents > MAX_AMOUNT_CENTS) {
    return { ok: false, error: `El monto máximo es ${formatCents(MAX_AMOUNT_CENTS)}. Revisa la cantidad.` };
  }

  const description = form.description.trim();
  if (description === '') {
    return { ok: false, error: 'Escribe una descripción, por ejemplo: Cena del viernes.' };
  }
  if (description.length > MAX_DESCRIPTION) {
    return { ok: false, error: `La descripción es muy larga. Usa ${MAX_DESCRIPTION} caracteres o menos.` };
  }

  if (!members.some((m) => m.id === form.paidByMemberId)) {
    return { ok: false, error: 'Elige quién pagó el gasto.' };
  }

  let participantIds;
  let splitsCents;

  if (form.splitMode === 'equal_all') {
    participantIds = members.map((m) => m.id);
    splitsCents = splitEqually(amountCents, participantIds);
  } else if (form.splitMode === 'equal_subset') {
    participantIds = members.filter((m) => form.selectedIds.includes(m.id)).map((m) => m.id);
    if (participantIds.length === 0) {
      return { ok: false, error: 'Elige al menos 1 persona que participó en el gasto.' };
    }
    splitsCents = splitEqually(amountCents, participantIds);
  } else if (form.splitMode === 'exact') {
    participantIds = [];
    splitsCents = {};
    for (const m of members) {
      const text = (form.exactTexts[m.id] ?? '').trim();
      if (text === '') continue;
      const cents = parseAmountToCents(text);
      if (cents === null) {
        return {
          ok: false,
          error: `El monto de ${m.name} no es válido. Usa solo números con hasta 2 decimales, por ejemplo 10 o 10.50.`,
        };
      }
      if (cents > 0) {
        participantIds.push(m.id);
        splitsCents[m.id] = cents;
      }
    }
    const { missingCents } = checkExactSplits(amountCents, splitsCents);
    if (missingCents !== 0) {
      const total = formatCents(amountCents);
      return {
        ok: false,
        error:
          missingCents > 0
            ? `Faltan ${formatCents(missingCents)} para llegar a ${total}. Ajusta los montos de cada persona.`
            : `Sobran ${formatCents(-missingCents)}: los montos suman más que ${total}. Ajusta los montos de cada persona.`,
      };
    }
  } else {
    return { ok: false, error: 'Elige cómo se divide el gasto.' };
  }

  return {
    ok: true,
    fields: {
      description,
      amountCents,
      paidByMemberId: form.paidByMemberId,
      splitMode: form.splitMode,
      participantIds,
      splitsCents,
    },
  };
}

/** Short text for the list: "Entre todos", "Sin Beto", "Entre Ana y Luis", "Montos exactos". */
export function splitLabel(expense, members) {
  if (expense.splitMode === 'exact') return 'Montos exactos';
  const included = members.filter((m) => expense.participantIds.includes(m.id));
  const excluded = members.filter((m) => !expense.participantIds.includes(m.id));
  if (excluded.length === 0) return 'Entre todos';
  const join = (list) =>
    list.length === 1 ? list[0].name : `${list.slice(0, -1).map((m) => m.name).join(', ')} y ${list.at(-1).name}`;
  if (excluded.length <= 2 && excluded.length < included.length) return `Sin ${join(excluded)}`;
  return `Entre ${join(included)}`;
}

