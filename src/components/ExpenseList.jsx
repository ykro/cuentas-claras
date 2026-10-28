import React from 'react';
import { Receipt, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function ExpenseList({ expenses, participants, onEditExpense, readOnly = false }) {
  const getPayerName = (paidById) => {
    const found = participants.find(p => p.id === paidById);
    if (!found) return 'Alguien';
    return found.isOwner ? 'Ti' : found.name;
  };

  const getSplitLabel = (expense) => {
    if (expense.splitType === 'equal') return 'Todos';
    if (expense.splitType === 'custom_equal') {
      const count = expense.splits ? expense.splits.length : 0;
      return `${count} ${count === 1 ? 'persona' : 'personas'}`;
    }
    if (expense.splitType === 'exact') return 'Montos exactos';
    return 'Todos';
  };

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white/40 my-2">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Receipt className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700 mb-1">
          No hay gastos anotados todavía
        </h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          {readOnly
            ? 'Este viaje se cerró sin gastos registrados.'
            : 'Toca en "Anotar Gasto" para registrar el primer consumo del grupo.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-slate-100 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {expenses.map((expense) => {
          const payerName = getPayerName(expense.paidById);
          const splitLabel = getSplitLabel(expense);

          if (readOnly) {
            return (
              <li key={expense.id}>
                <div className="w-full min-h-[58px] p-3.5 flex items-center justify-between text-left gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {expense.description}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      Pagó {payerName} • {splitLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold font-mono text-slate-900">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={expense.id}>
              <button
                type="button"
                onClick={() => onEditExpense && onEditExpense(expense)}
                className="w-full min-h-[58px] p-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {expense.description}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Pagó {payerName} • {splitLabel}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-bold font-mono text-slate-900">
                    {formatCurrency(expense.amount)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
