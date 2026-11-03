import { PlugZap } from 'lucide-react';
import { isFirebaseConfigured } from './lib/firebase.js';

function MissingFirebaseNotice() {
  return (
    <section
      role="alert"
      className="mt-10 border-t border-slate-200 pt-8"
    >
      <PlugZap className="h-8 w-8 text-debt" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold">Falta conectar Firebase</h2>
      <p className="mt-2 text-base leading-relaxed text-slate-600">
        La app todavía no tiene las claves de tu proyecto de Firebase. Copia{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">.env.example</code> como{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">.env</code>, llena sus valores
        y vuelve a abrir la app.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Cuentas Claras</h1>
      <p className="mt-2 text-base text-slate-600">
        Anota los gastos del grupo y mira quién le paga a quién.
      </p>
      {isFirebaseConfigured ? (
        <p className="mt-10 text-base text-credit">Firebase conectado.</p>
      ) : (
        <MissingFirebaseNotice />
      )}
    </main>
  );
}
