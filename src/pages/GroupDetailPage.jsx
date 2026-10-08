import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Receipt, 
  Scale, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { 
  subscribeGroup, 
  updateGroup, 
  deleteGroup 
} from '../services/groupsService.js';
import { 
  subscribeExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense 
} from '../services/expensesService.js';
import { 
  subscribeSettlements, 
  createSettlement, 
  deleteSettlement 
} from '../services/settlementsService.js';
import ParticipantList from '../components/ParticipantList.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import SettlementList from '../components/SettlementList.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
import { calculateBalances, simplifyDebts } from '../utils/debtSimplifier.js';
import { toCents, toDollars, formatCurrency } from '../utils/formatters.js';

export default function GroupDetailPage({ groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balances'
  
  // Modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Estados de edición del grupo
  const [editingName, setEditingName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Suscripción al grupo, gastos y pagos en tiempo real
  useEffect(() => {
    if (!groupId) return;

    const unsubscribeGroup = subscribeGroup(
      groupId,
      (fetchedGroup) => {
        if (!fetchedGroup) {
          onBack();
          return;
        }
        setGroup(fetchedGroup);
        setEditingName(fetchedGroup.name);
        setLoading(false);
      },
      (err) => {
        console.error('Error al obtener grupo:', err);
        setError('No pudimos cargar los datos del grupo.');
        setLoading(false);
      }
    );

    const unsubscribeExpenses = subscribeExpenses(
      groupId,
      (fetchedExpenses) => {
        setExpenses(fetchedExpenses);
      },
      (err) => {
        console.error('Error al obtener gastos:', err);
        setError('No pudimos cargar los gastos del grupo.');
      }
    );

    const unsubscribeSettlements = subscribeSettlements(
      groupId,
      (fetchedSettlements) => {
        setSettlements(fetchedSettlements);
      },
      (err) => {
        console.error('Error al obtener liquidaciones:', err);
      }
    );

    return () => {
      unsubscribeGroup();
      unsubscribeExpenses();
      unsubscribeSettlements();
    };
  }, [groupId, onBack]);

  // Cálculos matemáticos puros
  const totalExpensesCents = expenses.reduce((sum, e) => sum + toCents(e.amount), 0);
  const totalExpensesDollars = toDollars(totalExpensesCents);

  const participants = group?.participants || [];
  const balances = calculateBalances(participants, expenses, settlements);
  const transactions = simplifyDebts(participants, expenses, settlements);

  // Identificar el balance de la organizadora (Tú)
  const organizerParticipant = participants.find(p => p.isOwner);
  const organizerBalance = balances.find(b => b.id === organizerParticipant?.id);
  const organizerNetBalance = organizerBalance ? organizerBalance.netBalance : 0;

  // Guardar gasto (crear o actualizar)
  const handleSaveExpense = async (expenseData) => {
    if (selectedExpense) {
      await updateExpense(groupId, selectedExpense.id, expenseData);
    } else {
      await createExpense(groupId, expenseData);
    }
    setIsExpenseFormOpen(false);
    setSelectedExpense(null);
  };

  // Eliminar gasto
  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    const confirmDelete = window.confirm('¿Segura de que quieres eliminar este gasto?');
    if (!confirmDelete) return;

    await deleteExpense(groupId, selectedExpense.id);
    setIsExpenseFormOpen(false);
    setSelectedExpense(null);
  };

  // Registrar un pago directo
  const handleMarkAsPaid = async (settlementData) => {
    try {
      await createSettlement(groupId, settlementData);
    } catch (err) {
      console.error('Error al registrar pago:', err);
      setError(err.message || 'No se pudo registrar el pago.');
    }
  };

  // Deshacer un pago directo
  const handleUndoPayment = async (settlementId) => {
    try {
      await deleteSettlement(groupId, settlementId);
    } catch (err) {
      console.error('Error al deshacer pago:', err);
      setError(err.message || 'No se pudo deshacer el pago.');
    }
  };

  const handleSaveGroupName = async () => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    try {
      await updateGroup(groupId, { name: trimmed });
      setIsEditingName(false);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el nombre.');
    }
  };

  const handleUpdateParticipants = async (updatedParticipants) => {
    try {
      await updateGroup(groupId, { participants: updatedParticipants });
    } catch (err) {
      setError(err.message || 'No se pudieron actualizar los participantes.');
    }
  };

  const handleDeleteGroup = async () => {
    const confirmDelete = window.confirm(
      `¿Estás segura de eliminar el grupo "${group.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteGroup(groupId);
      onBack();
    } catch (err) {
      console.error('Error al eliminar grupo:', err);
      setError('No se pudo eliminar el grupo. Inténtalo de nuevo.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col">
      {/* Barra superior de navegación interna */}
      <div className="p-4 border-b border-slate-200/80 bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            aria-label="Volver a mis grupos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="truncate">
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {group.name}
            </h1>
            <p className="text-xs text-slate-400">
              {group.participants.length} participantes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          title="Personas y ajustes del grupo"
          aria-label="Ajustes del grupo"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Selector de pestañas: Gastos vs Saldos */}
      <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200/60">
        <div className="flex bg-slate-200/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 min-h-[40px] text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Gastos ({expenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            className={`flex-1 min-h-[40px] text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'balances'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Saldos y Pagos</span>
          </button>
        </div>
      </div>

      {/* Mensajes de error globales */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Contenido de la pestaña activa */}
      <div className="flex-1 p-4 flex flex-col">
        {activeTab === 'expenses' ? (
          <div className="flex-1 flex flex-col">
            {/* Resumen superior de total */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-4 text-center shadow-2xs">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total gastado
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                {formatCurrency(totalExpensesDollars)}
              </div>
            </div>

            {/* Botón de Acción Principal para Anotar Gasto */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedExpense(null);
                  setIsExpenseFormOpen(true);
                }}
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Anotar Gasto</span>
              </button>
            </div>

            {/* Lista de gastos */}
            <div className="flex-1">
              <ExpenseList
                expenses={expenses}
                participants={group.participants}
                onEditExpense={(exp) => {
                  setSelectedExpense(exp);
                  setIsExpenseFormOpen(true);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4">
            {/* Indicador grande y llamativo del balance del organizador */}
            <div className={`rounded-2xl p-4 text-center border shadow-2xs ${
              organizerNetBalance > 0
                ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-900'
                : organizerNetBalance < 0
                  ? 'bg-red-50/90 border-red-200/90 text-red-900'
                  : 'bg-white border-slate-200/80 text-slate-800'
            }`}>
              <span className="text-xs font-medium uppercase tracking-wider block opacity-75">
                Tu saldo en este viaje
              </span>

              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-1">
                {organizerNetBalance > 0 && `Te deben ${formatCurrency(organizerNetBalance)}`}
                {organizerNetBalance < 0 && `Debes ${formatCurrency(Math.abs(organizerNetBalance))}`}
                {organizerNetBalance === 0 && 'Estás al día ($0.00)'}
              </div>
            </div>

            {/* Bloque: Quién le paga a quién */}
            <SettlementList
              transactions={transactions}
              settlements={settlements}
              participants={participants}
              onMarkAsPaid={handleMarkAsPaid}
              onUndoPayment={handleUndoPayment}
            />

            {/* Desglose individual de todos los participantes */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Balances individuales
              </h3>
              <ul className="divide-y divide-slate-100 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                {balances.map((b) => (
                  <li key={b.id} className="p-3.5 flex items-center justify-between text-sm gap-2">
                    <span className="font-medium text-slate-800 truncate">
                      {b.name} {b.id === organizerParticipant?.id && '(Tú)'}
                    </span>

                    <span className={`font-mono font-bold text-sm shrink-0 ${
                      b.netBalance > 0
                        ? 'text-emerald-600'
                        : b.netBalance < 0
                          ? 'text-red-600'
                          : 'text-slate-400 font-normal'
                    }`}>
                      {b.netBalance > 0 && `+${formatCurrency(b.netBalance)}`}
                      {b.netBalance < 0 && formatCurrency(b.netBalance)}
                      {b.netBalance === 0 && 'Al día'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botón Principal: Compartir por WhatsApp */}
            <div className="pt-2 pb-4">
              <WhatsAppButton
                groupName={group.name}
                totalExpenses={totalExpensesDollars}
                balances={balances}
                transactions={transactions}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Anotar / Editar Gasto */}
      {isExpenseFormOpen && (
        <ExpenseForm
          participants={group.participants}
          expense={selectedExpense}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
          onClose={() => {
            setIsExpenseFormOpen(false);
            setSelectedExpense(null);
          }}
        />
      )}

      {/* Modal / Panel de Configuración del Grupo y Personas */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Personas y Ajustes
              </h2>
              <button
                type="button"
                onClick={() => { setIsSettingsOpen(false); setError(''); }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-5">
              {/* Editar nombre del grupo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre del viaje
                </label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 border border-emerald-500 rounded-xl focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveGroupName}
                      className="min-h-[44px] px-3.5 bg-emerald-600 text-white rounded-xl text-sm font-medium"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-sm font-semibold text-slate-900">{group.name}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-emerald-700 font-semibold hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Lista y administración de participantes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Personas del grupo ({group.participants.length})
                </label>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  Puedes corregir nombres o agregar más amigos en cualquier momento.
                </p>
                <ParticipantList
                  participants={group.participants}
                  onUpdate={handleUpdateParticipants}
                />
              </div>

              {/* Eliminar grupo */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  disabled={isDeleting}
                  className="w-full min-h-[44px] text-xs font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar este grupo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
