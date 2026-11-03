import { ArrowLeft, Pencil, Plus, ChevronRight } from 'lucide-react';
import { formatCents } from '../lib/balances.js';
import { splitLabel } from '../lib/expenses.js';

/**
 * Group detail: header with the total and the expense history.
 * Single main action: "Anotar gasto".
 */
export default function GroupDetail({ group, expenses, error, onBack, onEditGroup, onNewExpense, onOpenExpense }) {
  const nameOf = (id) => group.members.find((m) => m.id === id)?.name ?? 'Alguien';
  const totalCents = (expenses ?? []).reduce((sum, e) => sum + e.amountCents, 0);
  const newestFirst = [...(expenses ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
      <header className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a Mis grupos"
          className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl active:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{group.name}</h1>
        <button
          type="button"
          onClick={onEditGroup}
          aria-label="Editar grupo"
          className="-mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
        >
          <Pencil className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <section className="mt-6">
        <p className="text-sm text-slate-500">Total gastado</p>
        <p className="mt-1 text-5xl font-bold tracking-tight tabular-nums">{formatCents(totalCents)}</p>
      </section>

      <h2 className="mt-8 text-sm font-medium text-slate-500">Gastos</h2>

      {error && (
        <p role="alert" className="mt-3 text-base leading-snug text-debt">
          {error}
        </p>
      )}

      {!error && expenses === undefined && <p className="mt-6 text-base text-slate-500">Cargando gastos…</p>}

      {expenses?.length === 0 && (
        <p className="mt-6 text-base text-slate-600">
          Todavía no hay gastos. Toca "Anotar gasto" para agregar el primero.
        </p>
      )}

      {newestFirst.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
          {newestFirst.map((expense) => (
            <li key={expense.id}>
              <button
                type="button"
                onClick={() => onOpenExpense(expense.id)}
                className="flex min-h-16 w-full items-center gap-3 py-3 text-left active:bg-slate-100"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-medium">{expense.description}</span>
                  <span className="block truncate text-sm text-slate-500">
                    Pagó {nameOf(expense.paidByMemberId)} · {splitLabel(expense, group.members)}
                  </span>
                </span>
                <span className="text-xl font-semibold tabular-nums">{formatCents(expense.amountCents)}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 mt-auto bg-[#f8fafc] pt-8">
        <button
          type="button"
          onClick={onNewExpense}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Anotar gasto
        </button>
      </div>
    </main>
  );
}

