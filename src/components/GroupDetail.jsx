import { useState } from 'react';
import { ArrowLeft, ChevronRight, Copy, MessageCircle, Pencil, Plus, Undo2 } from 'lucide-react';
import { computeBalances, formatCents, settleUp } from '../lib/balances.js';
import { splitLabel } from '../lib/expenses.js';
import { buildSummaryMessage, whatsappUrl } from '../lib/whatsapp.js';
import BalancesView from './BalancesView.jsx';

const tabClass = (active) =>
  `h-11 flex-1 rounded-lg text-base font-medium transition ${
    active ? 'bg-white text-ink shadow-sm' : 'text-slate-600'
  }`;

/**
 * Group detail: total, the organizer's balance and two tabs (Saldos / Gastos).
 * Single main action: "Enviar por WhatsApp" in Saldos with pending payments; "Anotar gasto" otherwise.
 */
export default function GroupDetail({
  group,
  expenses,
  payments,
  error,
  tab,
  onTabChange,
  onBack,
  onEditGroup,
  onNewExpense,
  onOpenExpense,
  onMarkPaid,
  onUndoPayment,
}) {
  const [notice, setNotice] = useState({ text: '', isError: false });
  const [undoingId, setUndoingId] = useState('');

  const members = group.members;
  const nameOf = (id) => members.find((m) => m.id === id)?.name ?? 'Alguien';
  const isLoading = expenses === undefined || payments === undefined;
  const expenseList = expenses ?? [];
  const paymentList = payments ?? [];

  const totalCents = expenseList.reduce((sum, e) => sum + e.amountCents, 0);
  const balances = computeBalances(group.memberIds, expenseList, paymentList);
  const transfers = settleUp(balances);
  const organizerCents = balances[members[0]?.id] ?? 0;

  const history = [
    ...expenseList.map((e) => ({ kind: 'expense', ...e })),
    ...paymentList.map((p) => ({ kind: 'payment', ...p })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const message = buildSummaryMessage({ groupName: group.name, totalCents, transfers, nameOf });
  const showWhatsAppAsMain = tab === 'balances' && transfers.length > 0;

  function sendWhatsApp() {
    window.open(whatsappUrl(message), '_blank', 'noopener');
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setNotice({ text: 'Mensaje copiado. Pégalo en el chat del grupo.', isError: false });
    } catch {
      setNotice({
        text: 'Tu navegador no dejó copiar el mensaje. Usa "Enviar por WhatsApp" para mandarlo.',
        isError: true,
      });
    }
  }

  async function markPaid(transfer) {
    setNotice({ text: '', isError: false });
    try {
      await onMarkPaid(transfer);
    } catch (err) {
      setNotice({ text: err.message, isError: true });
    }
  }

  async function undoPayment(paymentId) {
    setNotice({ text: '', isError: false });
    setUndoingId(paymentId);
    try {
      await onUndoPayment(paymentId);
    } catch (err) {
      setNotice({ text: err.message, isError: true });
    } finally {
      setUndoingId('');
    }
  }

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
        {!isLoading && expenseList.length > 0 && (
          <p
            className={`mt-2 text-lg font-semibold ${
              organizerCents > 0 ? 'text-credit' : organizerCents < 0 ? 'text-debt' : 'text-slate-600'
            }`}
          >
            {organizerCents > 0
              ? `Te deben ${formatCents(organizerCents)}`
              : organizerCents < 0
                ? `Debes ${formatCents(-organizerCents)}`
                : 'Estás a mano'}
          </p>
        )}
      </section>

      <div role="tablist" aria-label="Vista del grupo" className="mt-6 flex gap-1 rounded-xl bg-slate-200/70 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'balances'}
          onClick={() => onTabChange('balances')}
          className={tabClass(tab === 'balances')}
        >
          Saldos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          onClick={() => onTabChange('history')}
          className={tabClass(tab === 'history')}
        >
          Gastos
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-base leading-snug text-debt">
          {error}
        </p>
      )}

      {!error && isLoading && <p className="mt-6 text-base text-slate-500">Cargando cuentas…</p>}

      {!isLoading && tab === 'balances' && (
        <>
          <BalancesView
            members={members}
            hasExpenses={expenseList.length > 0}
            balances={balances}
            transfers={transfers}
            onMarkPaid={markPaid}
          />
          {expenseList.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-4">
              {!showWhatsAppAsMain && (
                <button
                  type="button"
                  onClick={sendWhatsApp}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-base font-medium text-ink active:bg-slate-100"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Enviar por WhatsApp
                </button>
              )}
              <button
                type="button"
                onClick={copyMessage}
                className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-base font-medium text-ink active:bg-slate-100"
              >
                <Copy className="h-5 w-5" aria-hidden="true" />
                Copiar mensaje
              </button>
            </div>
          )}
        </>
      )}

      {!isLoading && tab === 'history' && (
        <>
          {history.length === 0 && (
            <p className="mt-6 text-base text-slate-600">
              Todavía no hay gastos. Toca "Anotar gasto" para agregar el primero.
            </p>
          )}
          {history.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {history.map((item) =>
                item.kind === 'expense' ? (
                  <li key={`e-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => onOpenExpense(item.id)}
                      className="flex min-h-16 w-full items-center gap-3 py-3 text-left active:bg-slate-100"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-medium">{item.description}</span>
                        <span className="block truncate text-sm text-slate-500">
                          Pagó {nameOf(item.paidByMemberId)} · {splitLabel(item, members)}
                        </span>
                      </span>
                      <span className="text-xl font-semibold tabular-nums">{formatCents(item.amountCents)}</span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                    </button>
                  </li>
                ) : (
                  <li key={`p-${item.id}`} className="flex min-h-16 items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-medium">
                        Pago {nameOf(item.fromMemberId)} → {nameOf(item.toMemberId)}
                      </span>
                      <span className="block text-sm text-credit">Pago registrado</span>
                    </span>
                    <span className="text-xl font-semibold tabular-nums">{formatCents(item.amountCents)}</span>
                    <button
                      type="button"
                      onClick={() => undoPayment(item.id)}
                      disabled={undoingId === item.id}
                      aria-label={`Deshacer pago de ${nameOf(item.fromMemberId)} a ${nameOf(item.toMemberId)}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100 disabled:opacity-60"
                    >
                      <Undo2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </>
      )}

      <div className="sticky bottom-0 mt-auto bg-[#f8fafc] pt-6">
        {notice.text && (
          <p role="status" className={`mb-3 text-base leading-snug ${notice.isError ? 'text-debt' : 'text-credit'}`}>
            {notice.text}
          </p>
        )}
        {showWhatsAppAsMain ? (
          <button
            type="button"
            onClick={sendWhatsApp}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99]"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Enviar por WhatsApp
          </button>
        ) : (
          <button
            type="button"
            onClick={onNewExpense}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Anotar gasto
          </button>
        )}
      </div>
    </main>
  );
}
