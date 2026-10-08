import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  Receipt, 
  Scale, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle,
  Check
} from 'lucide-react';
import { 
  subscribeGroup, 
  updateGroup, 
  deleteGroup 
} from '../services/groupsService.js';
import ParticipantList from '../components/ParticipantList.jsx';

export default function GroupDetailPage({ groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balances'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = subscribeGroup(
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

    return () => unsubscribe();
  }, [groupId, onBack]);

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
            <span>Gastos</span>
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

      {/* Contenido de la pestaña activa */}
      <div className="flex-1 p-4 flex flex-col">
        {activeTab === 'expenses' ? (
          <div className="flex-1 flex flex-col">
            {/* Resumen superior de total */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-4 text-center">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total gastado
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-0.5">
                $0.00
              </div>
            </div>

            {/* Lista vacía de gastos (se completa en Tarea 6) */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white/40 my-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 mb-1">
                No hay gastos anotados todavía
              </h2>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                En la siguiente tarea podrás registrar las compras del viaje y dividirlas.
              </p>
              <button
                type="button"
                className="min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-colors opacity-90"
                onClick={() => alert('El registro de gastos se habilita en la Tarea 6.')}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Anotar Gasto</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Lista de personas del grupo para ver cómo están compuestas */}
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Participantes del viaje ({group.participants.length})
              </h2>
              <ul className="divide-y divide-slate-100 bg-white border border-slate-200/80 rounded-xl overflow-hidden">
                {group.participants.map((p) => (
                  <li key={p.id} className="p-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{p.name}</span>
                    {p.isOwner && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Organizadora
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center p-6 bg-slate-100/60 rounded-xl border border-slate-200/60">
              <Scale className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Los saldos y la opción de compartir por WhatsApp se calcularán cuando agregues gastos.
              </p>
            </div>
          </div>
        )}
      </div>

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
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

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
