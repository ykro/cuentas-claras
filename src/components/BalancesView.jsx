import { useState } from 'react';
import { ArrowRight, Check, CircleCheck } from 'lucide-react';
import { formatBalance, formatCents } from '../lib/balances.js';

/**
 * "Saldos" tab: who pays whom (minimum payments) and each person's balance.
 * @param {{ members: {id:string,name:string}[], hasExpenses: boolean,
 *   balances: Record<string, number>, transfers: object[],
 *   onMarkPaid: (transfer: object) => Promise<void> }} props
 */
export default function BalancesView({ members, hasExpenses, balances, transfers, onMarkPaid }) {
  const [pendingKey, setPendingKey] = useState('');
  const nameOf = (id) => members.find((m) => m.id === id)?.name ?? 'Alguien';

  async function markPaid(transfer, key) {
    setPendingKey(key);
    try {
      await onMarkPaid(transfer);
    } finally {
      setPendingKey('');
    }
  }

  if (!hasExpenses) {
    return (
      <p className="mt-6 text-base text-slate-600">
        Todavía no hay gastos. Cuando anotes el primero, aquí verás quién le paga a quién.
      </p>
    );
  }

  return (
    <>
      <h2 className="mt-6 text-sm font-medium text-slate-500">Quién le paga a quién</h2>
      {transfers.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-credit">
          <CircleCheck className="h-6 w-6" aria-hidden="true" />
          Todos están a mano
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
          {transfers.map((t) => {
            const key = `${t.fromMemberId}-${t.toMemberId}-${t.amountCents}`;
            return (
              <li key={key} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-base">
                    <span className="truncate">{nameOf(t.fromMemberId)}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-label="le paga a" />
                    <span className="truncate">{nameOf(t.toMemberId)}</span>
                  </span>
                  <span className="block text-2xl font-semibold tabular-nums">{formatCents(t.amountCents)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => markPaid(t, key)}
                  disabled={pendingKey !== ''}
                  className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-base active:bg-slate-100 disabled:opacity-60"
                >
                  <Check className="h-5 w-5 text-credit" aria-hidden="true" />
                  {pendingKey === key ? 'Guardando…' : 'Marcar pagado'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-8 text-sm font-medium text-slate-500">Saldo de cada persona</h2>
      <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
        {members.map((m) => {
          const cents = balances[m.id] ?? 0;
          const status = cents > 0 ? 'Le deben' : cents < 0 ? 'Debe' : 'A mano';
          const color = cents > 0 ? 'text-credit' : cents < 0 ? 'text-debt' : 'text-ink';
          return (
            <li key={m.id} className="flex min-h-14 items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium">{m.name}</span>
                <span className={`block text-sm ${cents === 0 ? 'text-slate-500' : color}`}>{status}</span>
              </span>
              <span className={`text-xl font-semibold tabular-nums ${color}`}>{formatBalance(cents)}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

