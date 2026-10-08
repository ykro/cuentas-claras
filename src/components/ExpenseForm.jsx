import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, Loader2, Check } from 'lucide-react';
import CurrencyInput from './CurrencyInput.jsx';
import { toCents, toDollars } from '../utils/formatters.js';

export default function ExpenseForm({ 
  participants, 
  expense, 
  onSave, 
  onDelete, 
  onClose 
}) {
  const isEditing = Boolean(expense?.id);

  const [description, setDescription] = useState(expense?.description || '');
  const [amountStr, setAmountStr] = useState(expense ? String(expense.amount) : '');
  const [paidById, setPaidById] = useState(expense?.paidById || participants[0]?.id || '');
  const [splitType, setSplitType] = useState(expense?.splitType || 'equal');

  // Para custom_equal: lista de IDs seleccionados
  const [selectedIds, setSelectedIds] = useState(() => {
    if (expense?.splitType === 'custom_equal' && expense.splits) {
      return expense.splits.map(s => s.participantId);
    }
    return participants.map(p => p.id);
  });

  // Para exact: mapa de id -> monto en string
  const [exactAmounts, setExactAmounts] = useState(() => {
    const map = {};
    participants.forEach(p => {
      const match = expense?.splits?.find(s => s.participantId === p.id);
      map[p.id] = match ? String(match.amount) : '';
    });
    return map;
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Asegurar que paidById tenga un valor válido
  useEffect(() => {
    if (!paidById && participants.length > 0) {
      setPaidById(participants[0].id);
    }
  }, [participants, paidById]);

  // Cálculo en tiempo real de diferencia en montos exactos
  const totalCents = toCents(amountStr);
  const exactSumCents = participants.reduce((sum, p) => {
    return sum + toCents(exactAmounts[p.id] || 0);
  }, 0);
  const diffCents = totalCents - exactSumCents;

  const toggleParticipantSelection = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) {
        setError('Debes incluir al menos a una persona en la división.');
        return;
      }
      setSelectedIds(selectedIds.filter(item => item !== id));
      setError('');
    } else {
      setSelectedIds([...selectedIds, id]);
      setError('');
    }
  };

  const handleExactAmountChange = (id, val) => {
    val = val.replace(',', '.');
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setExactAmounts({
        ...exactAmounts,
        [id]: val,
      });
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedDesc = description.trim();

    if (!trimmedDesc) {
      setError('Escribe una descripción del gasto (ej. Hospedaje, Cena).');
      return;
    }

    if (totalCents <= 0) {
      setError('El monto debe ser un valor mayor a $0.00.');
      return;
    }

    if (!paidById) {
      setError('Selecciona quién pagó este gasto.');
      return;
    }

    let splits = [];

    if (splitType === 'equal') {
      splits = participants.map(p => ({ participantId: p.id }));
    } else if (splitType === 'custom_equal') {
      if (selectedIds.length === 0) {
        setError('Selecciona al menos una persona para dividir el gasto.');
        return;
      }
      splits = selectedIds.map(id => ({ participantId: id }));
    } else if (splitType === 'exact') {
      if (diffCents !== 0) {
        setError(`La suma de los montos individuales debe coincidir con el total ($${toDollars(totalCents).toFixed(2)}).`);
        return;
      }
      splits = participants
        .filter(p => toCents(exactAmounts[p.id] || 0) > 0)
        .map(p => ({
          participantId: p.id,
          amount: toDollars(toCents(exactAmounts[p.id] || 0)),
        }));

      if (splits.length === 0) {
        setError('Al menos una persona debe tener un monto asignado.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        description: trimmedDesc,
        amount: toDollars(totalCents),
        paidById,
        splitType,
        splits,
      });
    } catch (err) {
      console.error('Error al guardar gasto:', err);
      setError(err.message || 'No se pudo guardar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {isEditing ? 'Editar Gasto' : 'Anotar Gasto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
            aria-label="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Campo de Monto grande */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
              Monto del gasto
            </label>
            <CurrencyInput
              value={amountStr}
              onChange={setAmountStr}
              autoFocus={!isEditing}
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="expenseDescription" className="block text-xs font-semibold text-slate-700 mb-1.5">
              ¿En qué se gastó?
            </label>
            <input
              id="expenseDescription"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Hospedaje, Cena viernes, Gasolina..."
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quién Pagó */}
          <div>
            <label htmlFor="paidBy" className="block text-xs font-semibold text-slate-700 mb-1.5">
              ¿Quién pagó?
            </label>
            <select
              id="paidBy"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isOwner ? '(Tú)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Modalidad de División */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              ¿Cómo se divide?
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`min-h-[40px] text-xs font-medium rounded-lg transition-all ${
                  splitType === 'equal'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entre todos
              </button>
              <button
                type="button"
                onClick={() => setSplitType('custom_equal')}
                className={`min-h-[40px] text-xs font-medium rounded-lg transition-all ${
                  splitType === 'custom_equal'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Solo algunos
              </button>
              <button
                type="button"
                onClick={() => setSplitType('exact')}
                className={`min-h-[40px] text-xs font-medium rounded-lg transition-all ${
                  splitType === 'exact'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Montos exactos
              </button>
            </div>
          </div>

          {/* Detalle según la división seleccionada */}
          {splitType === 'equal' && (
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              Se dividirá en partes iguales entre las {participants.length} personas del grupo
              {totalCents > 0 && ` ($${(toDollars(totalCents) / participants.length).toFixed(2)} cada uno)`}.
            </p>
          )}

          {splitType === 'custom_equal' && (
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <p className="text-xs text-slate-500 mb-2">
                Marca a quienes participaron en este gasto:
              </p>
              {participants.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParticipantSelection(p.id)}
                    className="w-full min-h-[44px] flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-left transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-800">
                      {p.name} {p.isOwner && '(Tú)'}
                    </span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {splitType === 'exact' && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">Monto asignado por persona:</span>
                <span className={`font-mono font-semibold ${
                  diffCents === 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {diffCents === 0 
                    ? 'Total exacto' 
                    : diffCents > 0 
                      ? `Faltan $${toDollars(diffCents).toFixed(2)}` 
                      : `Sobran $${toDollars(-diffCents).toFixed(2)}`
                  }
                </span>
              </div>

              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 min-h-[44px]">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {p.name} {p.isOwner && '(Tú)'}
                  </span>
                  <div className="relative flex items-center w-28">
                    <span className="absolute left-2.5 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={exactAmounts[p.id] || ''}
                      onChange={(e) => handleExactAmountChange(p.id, e.target.value)}
                      placeholder="0.00"
                      className="w-full min-h-[40px] pl-6 pr-2.5 py-1 text-sm font-mono text-right bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || totalCents <= 0 || !description.trim()}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Gasto</span>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full min-h-[44px] text-xs font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl py-2 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar este gasto</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
