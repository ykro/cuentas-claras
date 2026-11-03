import { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase.js';

export default function Welcome() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setIsSigningIn(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10">
      <img
        src="/amigos.webp"
        width="800"
        height="602"
        alt="Tres amigos en una mesa revisando la cuenta en un celular"
        className="mx-auto h-auto w-full max-w-xs"
      />

      <div className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight">Cuentas Claras</h1>
        <p className="mt-2 text-lg leading-snug text-slate-600">
          Anota los gastos del grupo y mira quién le paga a quién.
        </p>
      </div>

      <div className="mt-auto pt-8">
        {error && (
          <p role="alert" className="mb-4 text-base leading-snug text-debt">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="h-14 w-full rounded-2xl bg-ink text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          {isSigningIn ? 'Abriendo Google…' : 'Continuar con Google'}
        </button>
      </div>
    </main>
  );
}

