import { useEffect, useState } from 'react';
import { ChevronRight, LogOut, Plus } from 'lucide-react';
import { signOutUser, watchExpenses } from '../lib/firebase.js';
import { formatCents } from '../lib/balances.js';
import { peopleLabel } from '../lib/groups.js';

function GroupRow({ uid, group, onOpen }) {
  const [totalCents, setTotalCents] = useState(null);

  useEffect(
    () =>
      watchExpenses(uid, group.id, (expenses) =>
        setTotalCents(expenses.reduce((sum, e) => sum + e.amountCents, 0)),
      ),
    [uid, group.id],
  );

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(group.id)}
        className="flex min-h-16 w-full items-center gap-3 py-3 text-left active:bg-slate-100"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{group.name}</span>
          <span className="block text-sm text-slate-500">{peopleLabel(group.members.length)}</span>
        </span>
        <span className="text-xl font-semibold tabular-nums">
          {totalCents === null ? '' : formatCents(totalCents)}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
    </li>
  );
}

// The organizer's groups. Single main action: "Nuevo grupo".
export default function GroupsScreen({ user, groups, error, onNewGroup, onOpenGroup }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mis grupos</h1>
        <button
          type="button"
          onClick={signOutUser}
          className="-mr-2 flex min-h-11 items-center gap-2 rounded-xl px-3 text-base text-slate-600 active:bg-slate-100"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </header>
      <p className="mt-1 truncate text-sm text-slate-500">Entraste como {user.email}</p>

      {error && (
        <p role="alert" className="mt-6 text-base leading-snug text-debt">
          {error}
        </p>
      )}

      {!error && groups === undefined && (
        <p className="mt-16 text-center text-base text-slate-500">Cargando tus grupos…</p>
      )}

      {groups?.length === 0 && (
        <section className="mt-16 text-center">
          <p className="text-lg font-semibold">Todavía no tienes grupos</p>
          <p className="mt-2 text-base text-slate-600">
            Crea uno para tu próximo viaje o salida y anota ahí los gastos.
          </p>
        </section>
      )}

      {groups?.length > 0 && (
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {groups.map((group) => (
            <GroupRow key={group.id} uid={user.uid} group={group} onOpen={onOpenGroup} />
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 mt-auto bg-[#f8fafc] pt-8">
        <button
          type="button"
          onClick={onNewGroup}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Nuevo grupo
        </button>
      </div>
    </main>
  );
}
