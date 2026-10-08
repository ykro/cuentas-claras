import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Navbar from './components/Navbar.jsx';
import { Plus, Users2, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-sm font-medium">Cargando Cuentas Claras...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Vista autenticada: Mis Grupos (Base para Tarea 5)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col">
        {/* Encabezado de sección */}
        <div className="flex items-center justify-between mb-6 pt-2">
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
            className="min-h-[44px] px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Grupo</span>
          </button>
        </div>

        {/* Estado inicial sin grupos */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white/50">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Users2 className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Aún no tienes grupos creados
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Crea tu primer grupo para comenzar a anotar los gastos del viaje y dividirlos fácilmente.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
