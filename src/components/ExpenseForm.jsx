import { useState } from 'react';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { createExpense, deleteExpense, updateExpense } from '../lib/firebase.js';
import { parseAmountToCents } from '../lib/balances.js';
import {
  MAX_DESCRIPTION,
  SPLIT_MODE_LABELS,
  buildExpense,
  emptyExpenseForm,
  equalShareLabel,
  exactProgress,
  exactProgressLabel,
  expenseToForm,
} from '../lib/expenses.js';

const chipClass = (selected) =>
  `min-h-11 rounded-xl border px-4 text-base transition ${
    selected ? 'border-ink bg-ink text-white' : 'border-slate-300 bg-white text-ink active:bg-slate-100'
  }`;

/**
 * Add or edit an expense. Single main action: "Guardar gasto".
 * @param {{ user: object, group: object, expense?: object, onDone: () => void }} props
 */
export default function ExpenseForm({ user, group, expense, onDone }) {
  const members = group.members;
  const isEditing = Boolean(expense);
  const [form, setForm] = useState(() => (expense ? expenseToForm(expense, members) : emptyExpenseForm(members)));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const update = (changes) => setForm((f) => ({ ...f, ...changes }));
  const amountCents = parseAmountToCents(form.amountText);
  const progress = form.splitMode === 'exact' ? exactProgress(form, members) : null;

  function toggleSelected(id) {
    update({
      selectedIds: form.selectedIds.includes(id)
        ? form.selectedIds.filter((x) => x !== id)
        : [...form.selectedIds, id],
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    const result = buildExpense(form, members);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing) await updateExpense(group.id, expense.id, result.fields);
      else await createExpense(user.uid, group.id, result.fields);
      onDone();
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setError('');
    setIsDeleting(true);
    try {
      await deleteExpense(group.id, expense.id);
      onDone();
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  }

  const equalCount = form.splitMode === 'equal_all' ? members.length : form.selectedIds.length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
      <header className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDone}
          aria-label={`Volver a ${group.name}`}
          className="-ml-3 flex h-11 w-11 items-center justify-center rounded-xl active:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-semibold">{isEditing ? 'Editar gasto' : 'Anotar gasto'}</h1>
      </header>

      <form onSubmit={handleSave} noValidate className="flex flex-1 flex-col">
        <label className="mt-6 block text-center">
          <span className="sr-only">Monto en dólares</span>
          <span className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-semibold text-slate-400">$</span>
            <input
              value={form.amountText}
              onChange={(e) => update({ amountText: e.target.value })}
              inputMode="decimal"
              placeholder="0.00"
              autoFocus={!isEditing}
              className="w-48 bg-transparent text-center text-5xl font-bold tabular-nums outline-none placeholder:text-slate-300"
            />
          </span>
        </label>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-slate-700">Descripción</span>
          <input
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            maxLength={MAX_DESCRIPTION}
            placeholder="Cena del viernes"
            className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-slate-700">Quién pagó</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={form.paidByMemberId === m.id}
                onClick={() => update({ paidByMemberId: m.id })}
                className={chipClass(form.paidByMemberId === m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-slate-700">Cómo se divide</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(SPLIT_MODE_LABELS).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={form.splitMode === mode}
                onClick={() => update({ splitMode: mode })}
                className={chipClass(form.splitMode === mode)}
              >
                {label}
              </button>
            ))}
          </div>

          {form.splitMode === 'equal_subset' && (
            <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
              {members.map((m) => {
                const checked = form.selectedIds.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleSelected(m.id)}
                      className="flex min-h-12 w-full items-center gap-3 text-left text-base"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                          checked ? 'border-ink bg-ink text-white' : 'border-slate-400 bg-white'
                        }`}
                      >
                        {checked && <Check className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      {m.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {form.splitMode === 'exact' && (
            <>
              <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-base">{m.name}</span>
                    <span className="text-base text-slate-400">$</span>
                    <input
                      value={form.exactTexts[m.id] ?? ''}
                      onChange={(e) => update({ exactTexts: { ...form.exactTexts, [m.id]: e.target.value } })}
                      inputMode="decimal"
                      placeholder="0.00"
                      aria-label={`Monto de ${m.name}`}
                      className="h-11 w-28 rounded-xl border border-slate-300 bg-white px-3 text-right text-base tabular-nums outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                    />
                  </li>
                ))}
              </ul>
              {progress && (
                <p
                  aria-live="polite"
                  className={`mt-2 text-base font-medium ${progress.missingCents === 0 ? 'text-credit' : 'text-debt'}`}
                >
                  {exactProgressLabel(progress.missingCents)}
                </p>
              )}
            </>
          )}

          {form.splitMode !== 'exact' && amountCents > 0 && equalCount > 0 && (
            <p className="mt-2 text-base text-slate-600">{equalShareLabel(amountCents, equalCount)}</p>
          )}
        </fieldset>

        {isEditing && (
          <div className="mt-10">
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-base text-debt active:bg-red-50"
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
                Borrar gasto
              </button>
            ) : (
              <div role="alertdialog" aria-label="Confirmar borrado" className="border-t border-slate-200 pt-4">
                <p className="text-base leading-snug">
                  Se borrará <strong>{expense.description}</strong> y los saldos se recalcularán.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-12 flex-1 rounded-xl border border-debt text-base font-semibold text-debt active:bg-red-50 disabled:opacity-60"
                  >
                    {isDeleting ? 'Borrando…' : 'Sí, borrar gasto'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="h-12 flex-1 rounded-xl border border-slate-300 text-base active:bg-slate-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 mt-auto bg-[#f8fafc] pt-6">
          {error && (
            <p role="alert" className="mb-3 text-base leading-snug text-debt">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="h-14 w-full rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : 'Guardar gasto'}
          </button>
        </div>
      </form>
    </main>
  );
}

