import React from 'react';
import { Wallet, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logotipo y Título */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Wallet className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">
            Cuentas Claras
          </span>
        </div>

        {/* Perfil del usuario y botón de cerrar sesión */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-4 h-4" />
                </div>
              )}
              <span className="text-xs font-medium text-slate-700 hidden sm:inline-block max-w-[120px] truncate">
                {user.displayName || 'Organizadora'}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
