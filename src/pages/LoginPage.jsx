import React from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import AuthButton from '../components/AuthButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { isFirebaseConfigured } from '../services/firebase.js';

export default function LoginPage() {
  const { error } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-emerald-100">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logotipo */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-sm mb-3 text-white">
          <Wallet className="w-7 h-7 stroke-[2.2]" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          Cuentas Claras
        </h1>
        <p className="text-sm text-slate-500 mb-2 max-w-xs leading-relaxed">
          Divide los gastos de viajes y salidas con tus amigos sin enredos ni hojas de cálculo.
        </p>

        {/* Ilustración de amigos */}
        <div className="w-full max-w-[240px] my-4 flex justify-center">
          <img
            src="/amigos.webp"
            alt="Grupo de amigos organizando gastos"
            className="w-full h-auto object-contain max-h-[180px]"
            loading="eager"
            width="800"
            height="593"
          />
        </div>

        {/* Notificación de error si ocurre */}
        {error && (
          <div className="w-full mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-left">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-normal">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Verificación de Firebase o Botón de Acción Principal */}
        {!isFirebaseConfigured ? (
          <div className="w-full bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-amber-900">
                  Falta conectar Firebase
                </h2>
                <p className="text-xs text-amber-700 mt-1 leading-normal">
                  Configura tus credenciales en el archivo <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[11px] font-mono">.env</code> para activar el inicio de sesión.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full mt-2">
            <AuthButton />
            <p className="text-[11px] text-slate-400 mt-3">
              Tus amigos no necesitan cuenta ni instalar nada.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
