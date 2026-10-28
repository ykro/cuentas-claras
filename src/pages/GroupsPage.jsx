import React, { useState, useEffect } from 'react';
import { Plus, Users2, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  createGroup, 
  subscribeUserGroups, 
  generateParticipantId 
} from '../services/groupsService.js';
import GroupCard from '../components/GroupCard.jsx';

export default function GroupsPage({ onSelectGroup }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado del formulario de creación
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeUserGroups(
      user.uid,
      (fetchedGroups) => {
        setGroups(fetchedGroups);
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar grupos:', err);
        setError('No pudimos cargar tus grupos. Revisa tu conexión.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = () => {
    const ownerName = user?.displayName ? user.displayName.split(' ')[0] : 'Yo';
    setGroupName('');
    setParticipants([
      { id: generateParticipantId(), name: ownerName, isOwner: true }
    ]);
    setNewParticipantName('');
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleAddParticipant = (e) => {
    e.preventDefault();
    const trimmed = newParticipantName.trim();
    if (!trimmed) return;

    if (participants.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ya agregaste a una persona con ese nombre.');
      return;
    }

    setParticipants([
      ...participants,
      { id: generateParticipantId(), name: trimmed, isOwner: false }
    ]);
    setNewParticipantName('');
    setError('');
  };

  const handleRemoveParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setError('Escribe el nombre del viaje o salida.');
      return;
    }

    if (participants.length < 2) {
      setError('Debes agregar al menos a un amigo para que el grupo tenga dos personas.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const created = await createGroup({
        name: trimmedName,
        participants,
        ownerId: user.uid,
      });

      handleCloseModal();
      if (onSelectGroup) {
        onSelectGroup(created.id);
      }
    } catch (err) {
      console.error('Error al crear grupo:', err);
      setError(err.message || 'No se pudo crear el grupo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeGroups = groups.filter((g) => !g.isClosed);
  const closedGroups = groups.filter((g) => g.isClosed === true);

  return (
    <div className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-5 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Mis Grupos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tus viajes y salidas organizadas
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Grupo</span>
        </button>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white/50 my-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Users2 className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 mb-1">
            Aún no tienes grupos creados
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-5">
            Crea tu primer grupo para comenzar a anotar los gastos del viaje y dividirlos fácilmente.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear primer grupo</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Lista de viajes activos */}
          {activeGroups.length === 0 ? (
            <div className="p-5 text-center border border-dashed border-slate-200 rounded-2xl bg-white/50">
              <p className="text-sm font-medium text-slate-700">
                No tienes viajes activos en este momento
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Todos tus viajes anteriores están en Viajes cerrados.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onClick={() => onSelectGroup && onSelectGroup(group.id)}
                />
              ))}
            </div>
          )}

          {/* Sección de Viajes cerrados al final de Mis Grupos */}
          {closedGroups.length > 0 && (
            <section className="pt-2 border-t border-slate-200/70">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Viajes cerrados
              </h2>
              <div className="space-y-2.5">
                {closedGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onClick={() => onSelectGroup && onSelectGroup(group.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal de Creación de Grupo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Crear Nuevo Grupo
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto pt-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Nombre del Grupo */}
              <div>
                <label htmlFor="groupName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre del viaje o salida
                </label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej. Viaje Fin de Semana"
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Participantes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Personas del grupo ({participants.length})
                </label>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  Solo escribe sus nombres de pila. No necesitan cuenta ni app.
                </p>

                {/* Formulario rápido para añadir amigo */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Nombre del amigo (ej. Carlos)..."
                    className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddParticipant(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    disabled={!newParticipantName.trim()}
                    className="min-h-[44px] px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir</span>
                  </button>
                </div>

                {/* Lista de chips/personas añadidas */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                  {participants.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-800 shadow-2xs"
                    >
                      <span>{p.name}</span>
                      {p.isOwner ? (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                          Tú
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(p.id)}
                          className="text-slate-400 hover:text-red-600 ml-0.5"
                          title="Quitar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botón de Acción Principal */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !groupName.trim() || participants.length < 2}
                  className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creando grupo...</span>
                    </>
                  ) : (
                    <span>Crear Grupo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
