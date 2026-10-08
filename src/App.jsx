import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import GroupDetailPage from './pages/GroupDetailPage.jsx';
import Navbar from './components/Navbar.jsx';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState(null);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {selectedGroupId ? (
          <GroupDetailPage
            groupId={selectedGroupId}
            onBack={() => setSelectedGroupId(null)}
          />
        ) : (
          <GroupsPage
            onSelectGroup={(id) => setSelectedGroupId(id)}
          />
        )}
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
