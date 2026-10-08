import React, { useState } from 'react';
import { User, Trash2, Edit2, Check, X, Plus, AlertCircle } from 'lucide-react';
import { generateParticipantId } from '../services/groupsService.js';

export default function ParticipantList({ participants, onUpdate, readOnly = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setError('');
  };

  const handleSaveEdit = (id) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    const updated = participants.map(p => 
      p.id === id ? { ...p, name: trimmed } : p
    );
    onUpdate(updated);
    setEditingId(null);
    setEditName('');
    setError('');
  };

  const handleRemove = (id) => {
    if (participants.length <= 2) {
      setError('El grupo debe tener al menos dos participantes.');
      return;
    }

    const updated = participants.filter(p => p.id !== id);
    onUpdate(updated);
    setError('');
  };

  const handleAddPerson = (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Verificar si ya existe alguien con ese nombre exacto para advertir
    const exists = participants.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError('Ya hay alguien con ese nombre en el grupo.');
      return;
    }

    const updated = [
      ...participants,
      {
        id: generateParticipantId(),
        name: trimmed,
        isOwner: false,
      },
    ];

    onUpdate(updated);
    setNewName('');
    setError('');
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de participantes plana */}
      <ul className="divide-y divide-slate-100 bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        {participants.map((p) => {
          const isEditing = editingId === p.id;

          return (
            <li key={p.id} className="p-3 flex items-center justify-between gap-3 min-h-[52px]">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <User className="w-4 h-4" />
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-h-[38px] px-2.5 py-1 text-sm bg-slate-50 border border-emerald-500 rounded-lg focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(p.id)}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="Guardar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {p.name}
                    </span>
                    {p.isOwner && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                        Tú
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!readOnly && !isEditing && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(p)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg"
                    title="Editar nombre"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!p.isOwner && participants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 rounded-lg"
                      title="Quitar persona"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Agregar nueva persona */}
      {!readOnly && (
        <form onSubmit={handleAddPerson} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de otra persona..."
            className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="min-h-[44px] px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </form>
      )}
    </div>
  );
}
