import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet, Target, Plus, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Link } from 'react-router-dom';
import type { Transaction, Goal } from '../types';

export function Dashboard() {
  const { userProfile } = useAuth();
  const { organization } = useOrg();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!organization?.id) return;

    // Fetch transactions
    const qTx = query(
      collection(db, 'transactions'),
      where('orgId', '==', organization.id)
    );
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(txData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // Fetch goals
    const qGoals = query(
      collection(db, 'goals'),
      where('orgId', '==', organization.id)
    );
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Goal[];
      setGoals(goalsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
    });

    return () => {
      unsubTx();
      unsubGoals();
    };
  }, [organization?.id]);

  const currentMonth = format(new Date(), 'MMMM', { locale: ptBR });
  
  // Calculate metrics
  const incomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = incomes - expenses;
  const saved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  
  // Just dummy for pending bills for now, could be fetched from 'bills' collection
  const pendingBills = 0;
  const safeToSpendDaily = Math.max(0, (balance - pendingBills) / 30); // simplistic calculation

  const metrics = { balance, incomes, expenses, saved, pendingBills, safeToSpendDaily };

  const displayName = userProfile?.displayName?.split(' ')[0] || 'Usuário';

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Boa noite, {displayName} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Aqui está o resumo da {organization?.name || 'sua casa'} em <span className="capitalize">{currentMonth}</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/transactions" className="hidden md:flex">
            <Button variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Ver Lançamentos
            </Button>
          </Link>
          <Link to="/transactions" className="hidden md:flex">
            <Button className="shadow-lg shadow-teal-600/20">
              <Plus className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
          </Link>
        </div>
      </header>

      {/* Safe to Spend Indicator */}
      <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-600/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-teal-100 font-medium mb-1">Você pode gastar até</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight">{formatCurrency(metrics.safeToSpendDaily)}</span>
              <span className="text-teal-100 mb-1">/ dia</span>
            </div>
            <p className="text-sm text-teal-100 mt-2 max-w-sm">
              Este valor considera suas contas futuras, receitas previstas e metas para o mês.
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-center min-w-[140px]">
            <p className="text-teal-50 text-sm mb-1">Disponível no Mês</p>
            <p className="text-xl font-bold">{formatCurrency(metrics.balance)}</p>
          </div>
        </div>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Recebidos</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Entradas</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(metrics.incomes)}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Pagos</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Despesas</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(metrics.expenses)}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Previstas</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Contas Pendentes</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(metrics.pendingBills)}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Guardado</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Economia</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(metrics.saved)}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Últimos Lançamentos</h3>
            <Link to="/transactions" className="text-sm text-teal-600 font-medium hover:text-teal-700">Ver todos</Link>
          </div>
          <CardContent className="p-0 flex-1">
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Nenhum lançamento recente.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 3).map((tx, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shadow-inner">
                        {tx.emoji || (tx.type === 'expense' ? '💸' : '💰')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{tx.description}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {tx.date && typeof tx.date.toDate === 'function' ? tx.date.toDate().toLocaleDateString('pt-BR') : new Date(tx.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.type === 'income' ? 'text-teal-600' : 'text-slate-900'}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Progresso das Metas</h3>
            <Link to="/goals" className="text-sm text-teal-600 font-medium hover:text-teal-700">Ver todas</Link>
          </div>
          <CardContent className="p-6 space-y-6 flex-1">
            {goals.length === 0 ? (
              <div className="text-center text-slate-500 text-sm h-full flex items-center justify-center">Nenhuma meta definida.</div>
            ) : (
              goals.slice(0, 2).map((goal, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{goal.emoji || '🎯'}</span>
                      <span className="font-medium text-slate-700">{goal.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-xs text-slate-500"> / {formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}% concluído</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
