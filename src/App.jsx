import React from 'react';
import { Wallet, AlertCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const isFirebaseConfigured = Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-emerald-100">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logotipo e isotipo */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-sm mb-5 text-white">
          <Wallet className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Cuentas Claras
        </h1>
        <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">
          Divide los gastos de viajes y salidas con tus amigos de forma transparente y sin enredos.
        </p>

        {/* Detector de conexión Firebase */}
        {!isFirebaseConfigured ? (
          <div className="w-full bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-amber-900">
                  Falta conectar Firebase
                </h2>
                <p className="text-xs text-amber-700 mt-1 leading-normal">
                  Configura tus credenciales en el archivo <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[11px] font-mono">.env</code> para activar la base de datos y el inicio de sesión.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full min-h-[44px] h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Continuar con Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </main>
  );
}
