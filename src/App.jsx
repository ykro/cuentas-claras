import { useEffect, useState } from 'react';
import { PlugZap } from 'lucide-react';
import { isFirebaseConfigured, watchExpenses, watchGroups, watchSession } from './lib/firebase.js';
import Welcome from './components/Welcome.jsx';
import GroupsScreen from './components/GroupsScreen.jsx';
import GroupForm from './components/GroupForm.jsx';
import GroupDetail from './components/GroupDetail.jsx';
import ExpenseForm from './components/ExpenseForm.jsx';

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
  // { name: 'groups' }
  // | { name: 'groupForm', groupId?: string }          (no groupId = new group)
  // | { name: 'group', groupId: string }               (group detail)
  // | { name: 'expenseForm', groupId: string, expenseId?: string }
  const [screen, setScreen] = useState({ name: 'groups' });
  // Expenses of the open group. undefined = still loading.
  const [expenses, setExpenses] = useState(undefined);
  const [expensesError, setExpensesError] = useState('');

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

  const openGroupId = screen.name === 'groups' ? null : screen.groupId ?? null;

  useEffect(() => {
    setExpenses(undefined);
    setExpensesError('');
    if (!user || !openGroupId) return undefined;
    return watchExpenses(user.uid, openGroupId, setExpenses, (err) => setExpensesError(err.message));
  }, [user, openGroupId]);

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
  const goToGroup = (groupId) => setScreen({ name: 'group', groupId });
  const groupsScreen = (
    <GroupsScreen
      user={user}
      groups={groups}
      error={groupsError}
      onNewGroup={() => setScreen({ name: 'groupForm' })}
      onOpenGroup={goToGroup}
    />
  );

  if (screen.name === 'groups') return groupsScreen;

  if (screen.name === 'groupForm' && !screen.groupId) {
    return <GroupForm key="new" user={user} onDone={goToGroups} onDeleted={goToGroups} />;
  }

  const group = groups?.find((g) => g.id === screen.groupId);
  // The group no longer exists (e.g. it was just deleted): back to the list.
  if (!group) return groupsScreen;

  if (screen.name === 'groupForm') {
    return (
      <GroupForm
        key={group.id}
        user={user}
        group={group}
        onDone={() => goToGroup(group.id)}
        onDeleted={goToGroups}
      />
    );
  }

  const groupDetail = (
    <GroupDetail
      group={group}
      expenses={expenses}
      error={expensesError}
      onBack={goToGroups}
      onEditGroup={() => setScreen({ name: 'groupForm', groupId: group.id })}
      onNewExpense={() => setScreen({ name: 'expenseForm', groupId: group.id })}
      onOpenExpense={(expenseId) => setScreen({ name: 'expenseForm', groupId: group.id, expenseId })}
    />
  );

  if (screen.name === 'expenseForm') {
    const expense = screen.expenseId ? expenses?.find((e) => e.id === screen.expenseId) : undefined;
    if (screen.expenseId && !expense) {
      // Still loading: wait. Already gone (e.g. just deleted): back to the group.
      if (expenses === undefined) {
        return (
          <main className="flex min-h-dvh items-center justify-center">
            <p className="text-base text-slate-500">Cargando gasto…</p>
          </main>
        );
      }
      return groupDetail;
    }
    return (
      <ExpenseForm
        key={screen.expenseId ?? 'new'}
        user={user}
        group={group}
        expense={expense}
        onDone={() => goToGroup(group.id)}
      />
    );
  }

  return groupDetail;
}
