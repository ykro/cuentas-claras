import React, { useState } from 'react';
import { Check, CheckCircle2, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function SettlementList({ 
  transactions, 
  settlements = [], 
  participants = [], 
  onMarkAsPaid, 
  onUndoPayment,
  readOnly = false
}) {
  const [submittingId, setSubmittingId] = useState(null);

  const handlePay = async (transaction) => {
    if (readOnly) return;
    const key = `${transaction.fromId}_${transaction.toId}_${transaction.amount}`;
    setSubmittingId(key);
    try {
      await onMarkAsPaid({
        fromParticipantId: transaction.fromId,
        toParticipantId: transaction.toId,
        amount: transaction.amount,
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const getParticipantName = (id) => {
    const found = participants.find(p => p.id === id);
    return found ? found.name : 'Alguien';
  };

  return (
    <div className="space-y-4">
      {/* Lista de transferencias sugeridas */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Quién le paga a quién
        </h3>

        {!transactions || transactions.length === 0 ? (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Todos quedaron a mano
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                No hay transferencias pendientes en este momento.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            {transactions.map((t) => {
              const key = `${t.fromId}_${t.toId}_${t.amount}`;
              const isSubmitting = submittingId === key;

              return (
                <li key={key} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 truncate">
                      <span className="font-semibold">{t.fromName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">{t.toName}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      Monto: <span className="font-semibold text-slate-900">{formatCurrency(t.amount)}</span>
                    </p>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handlePay(t)}
                      disabled={isSubmitting}
                      className="min-h-[44px] px-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200/80 flex items-center gap-1.5 transition-colors shrink-0"
                      title="Registrar que esta persona ya transfirió"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5] text-emerald-600" />
                          <span>Marcar pagado</span>
                        </>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Historial de pagos realizados con opción de deshacer */}
      {settlements && settlements.length > 0 && (
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Pagos ya registrados ({settlements.length})
          </h3>
          <ul className="divide-y divide-slate-100 bg-white border border-slate-200/70 rounded-xl overflow-hidden">
            {settlements.map((s) => (
              <li key={s.id} className="p-3 flex items-center justify-between text-xs text-slate-600 gap-2">
                <div className="truncate">
                  <span className="font-medium text-slate-900">{getParticipantName(s.fromParticipantId)}</span>
                  {' le pagó '}
                  <span className="font-semibold text-slate-900 font-mono">{formatCurrency(s.amount)}</span>
                  {' a '}
                  <span className="font-medium text-slate-900">{getParticipantName(s.toParticipantId)}</span>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onUndoPayment(s.id)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                    title="Deshacer pago"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
