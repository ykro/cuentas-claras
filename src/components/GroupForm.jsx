import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { createGroup, deleteGroup, getGroupMovements, updateGroup } from '../lib/firebase.js';
import { canRemoveMember } from '../lib/balances.js';
import { MAX_GROUP_NAME, MAX_PERSON_NAME, newMemberId, validateGroupDraft } from '../lib/groups.js';

const inputClass =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/10';

/**
 * Create or edit a group. The first person is always the organizer and cannot be removed.
 * @param {{ user: object, group?: object, onDone: () => void, onDeleted: () => void }} props
 */
export default function GroupForm({ user, group, onDone, onDeleted }) {
  const isEditing = Boolean(group);
  const existingIds = group?.memberIds ?? [];

  const [name, setName] = useState(group?.name ?? '');
  const [members, setMembers] = useState(
    () => group?.members ?? [
      { id: newMemberId(), name: 'Yo' },
      { id: newMemberId(), name: '' },
    ],
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const movements = useRef(null);
  const focusId = useRef(null);

  // In edit mode, load expenses and payments to know who can be removed.
  useEffect(() => {
    if (!isEditing) return;
    getGroupMovements(user.uid, group.id)
      .then((result) => {
        movements.current = result;
      })
      .catch(() => {});
  }, [isEditing, user.uid, group?.id]);

  function renamePerson(id, value) {
    setMembers((list) => list.map((m) => (m.id === id ? { ...m, name: value } : m)));
  }

  function addPerson() {
    const id = newMemberId();
    focusId.current = id;
    setMembers((list) => [...list, { id, name: '' }]);
  }

  async function removePerson(member) {
    setError('');
    if (existingIds.includes(member.id)) {
      try {
        movements.current ??= await getGroupMovements(user.uid, group.id);
      } catch (err) {
        setError(err.message);
        return;
      }
      const { expenses, payments } = movements.current;
      if (!canRemoveMember(member.id, expenses, payments)) {
        setError(
          `No puedes quitar a ${member.name} porque tiene gastos o pagos en este grupo. Primero edita o borra esos movimientos y luego quítalo.`,
        );
        return;
      }
    }
    setMembers((list) => list.filter((m) => m.id !== member.id));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    const result = validateGroupDraft({ name, members }, existingIds);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing) await updateGroup(group.id, result.fields);
      else await createGroup(user.uid, result.fields);
      onDone();
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setError('');
    setIsDeleting(true);
    try {
      await deleteGroup(user.uid, group.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
      <header className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDone}
          aria-label={isEditing ? `Volver a ${group.name}` : 'Volver a Mis grupos'}
          className="-ml-3 flex h-11 w-11 items-center justify-center rounded-xl active:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">{isEditing ? 'Editar grupo' : 'Nuevo grupo'}</h1>
      </header>

      <form onSubmit={handleSave} noValidate className="flex flex-1 flex-col">
        <label className="mt-6 block">
          <span className="text-sm font-medium text-slate-700">Nombre del grupo</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_GROUP_NAME}
            placeholder="Viaje a Antigua"
            autoFocus={!isEditing}
            className={`${inputClass} mt-1`}
          />
        </label>

        <fieldset className="mt-8">
          <legend className="text-sm font-medium text-slate-700">Personas</legend>
          <ul className="mt-1 divide-y divide-slate-200 border-y border-slate-200">
            {members.map((member, index) => {
              const isOrganizer = index === 0;
              return (
                <li key={member.id} className="flex items-center gap-2 py-2">
                  <input
                    value={member.name}
                    onChange={(e) => renamePerson(member.id, e.target.value)}
                    maxLength={MAX_PERSON_NAME}
                    placeholder={isOrganizer ? 'Tu nombre' : `Persona ${index + 1}`}
                    aria-label={isOrganizer ? 'Tu nombre (organizadora)' : `Nombre de la persona ${index + 1}`}
                    autoFocus={focusId.current === member.id}
                    className={inputClass}
                  />
                  {isOrganizer ? (
                    <span className="w-11 shrink-0 text-center text-xs text-slate-500">Tú</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removePerson(member)}
                      aria-label={`Quitar a ${member.name || `la persona ${index + 1}`}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={addPerson}
            className="mt-2 flex min-h-11 items-center gap-2 rounded-xl px-1 text-base font-medium text-ink active:bg-slate-100"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Agregar persona
          </button>
        </fieldset>

        {isEditing && (
          <div className="mt-10">
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-base text-debt active:bg-red-50"
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
                Borrar grupo
              </button>
            ) : (
              <div role="alertdialog" aria-label="Confirmar borrado" className="border-t border-slate-200 pt-4">
                <p className="text-base leading-snug">
                  Se borrarán <strong>{group.name}</strong>, sus gastos y sus pagos. No se puede deshacer.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-12 flex-1 rounded-xl border border-debt text-base font-semibold text-debt active:bg-red-50 disabled:opacity-60"
                  >
                    {isDeleting ? 'Borrando…' : 'Sí, borrar grupo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="h-12 flex-1 rounded-xl border border-slate-300 text-base active:bg-slate-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 mt-auto bg-[#f8fafc] pt-6">
          {error && (
            <p role="alert" className="mb-3 text-base leading-snug text-debt">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="h-14 w-full rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : 'Guardar grupo'}
          </button>
        </div>
      </form>
    </main>
  );
}

