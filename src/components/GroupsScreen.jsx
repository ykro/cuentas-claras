import { LogOut, Plus } from 'lucide-react';
import { signOutUser } from '../lib/firebase.js';

// List of the organizer's groups. Empty for now: creating groups comes in task 5.
export default function GroupsScreen({ user }) {
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

      <section className="mt-16 text-center">
        <p className="text-lg font-semibold">Todavía no tienes grupos</p>
        <p className="mt-2 text-base text-slate-600">
          Crea uno para tu próximo viaje o salida y anota ahí los gastos.
        </p>
      </section>

      <div className="mt-auto pt-8">
        <button
          type="button"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Nuevo grupo
        </button>
      </div>
    </main>
  );
}

