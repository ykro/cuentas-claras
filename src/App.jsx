import { useEffect, useState } from 'react';
import { PlugZap } from 'lucide-react';
import { isFirebaseConfigured, watchGroups, watchSession } from './lib/firebase.js';
import Welcome from './components/Welcome.jsx';
import GroupsScreen from './components/GroupsScreen.jsx';
import GroupForm from './components/GroupForm.jsx';

function MissingFirebaseNotice() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Cuentas Claras</h1>
      <section role="alert" className="mt-10 border-t border-slate-200 pt-8">
        <PlugZap className="h-8 w-8 text-debt" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">Falta conectar Firebase</h2>
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          La app todavía no tiene las claves de tu proyecto de Firebase. Copia{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">.env.example</code> como{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">.env</code>, llena sus valores
          y vuelve a abrir la app.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  // undefined = still checking the session; null = signed out.
  const [user, setUser] = useState(undefined);
  // undefined = still loading the groups.
  const [groups, setGroups] = useState(undefined);
  const [groupsError, setGroupsError] = useState('');
  // { name: 'groups' } | { name: 'groupForm', groupId?: string }
  const [screen, setScreen] = useState({ name: 'groups' });

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return watchSession((nextUser) => {
      setUser(nextUser);
      setScreen({ name: 'groups' });
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setGroups(undefined);
      return undefined;
    }
    setGroupsError('');
    return watchGroups(user.uid, setGroups, (err) => setGroupsError(err.message));
  }, [user]);

  if (!isFirebaseConfigured) return <MissingFirebaseNotice />;
  if (user === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-base text-slate-500">Cargando…</p>
      </main>
    );
  }
  if (!user) return <Welcome />;

  const goToGroups = () => setScreen({ name: 'groups' });

  if (screen.name === 'groupForm') {
    const group = screen.groupId ? groups?.find((g) => g.id === screen.groupId) : undefined;
    // The group was opened for editing but no longer exists (e.g. it was just deleted).
    if (screen.groupId && !group) {
      return (
        <GroupsScreen
          user={user}
          groups={groups}
          error={groupsError}
          onNewGroup={() => setScreen({ name: 'groupForm' })}
          onOpenGroup={(groupId) => setScreen({ name: 'groupForm', groupId })}
        />
      );
    }
    return <GroupForm key={screen.groupId ?? 'new'} user={user} group={group} onDone={goToGroups} />;
  }

  return (
    <GroupsScreen
      user={user}
      groups={groups}
      error={groupsError}
      onNewGroup={() => setScreen({ name: 'groupForm' })}
      onOpenGroup={(groupId) => setScreen({ name: 'groupForm', groupId })}
    />
  );
}
