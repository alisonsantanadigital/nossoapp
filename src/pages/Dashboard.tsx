import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { formatCurrency } from "../lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Target,
  Plus,
  Receipt,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import type { Transaction, Goal } from "../types";

export function Dashboard() {
  const { userProfile } = useAuth();
  const { organization } = useOrg();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [periodFilter, setPeriodFilter] = useState<"current_month" | "all_time">("current_month");

  useEffect(() => {
    if (!organization?.id) return;

    // Fetch transactions
    const qTx = query(
      collection(db, "transactions"),
      where("orgId", "==", organization.id),
    );
    const unsubTx = onSnapshot(
      qTx,
      (snapshot) => {
        const txData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(txData);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "transactions");
      },
    );

    // Fetch goals
    const qGoals = query(
      collection(db, "goals"),
      where("orgId", "==", organization.id),
    );
    const unsubGoals = onSnapshot(
      qGoals,
      (snapshot) => {
        const goalsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Goal[];
        setGoals(goalsData);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "goals");
      },
    );

  
  

  
  return () => {
      unsubTx();
      unsubGoals();
    };
  }, [organization?.id]);


  const toggleTransactionStatus = async (tx: Transaction) => {
    if (!navigator.onLine) {
      alert("Sem conexão com a internet.");
      return;
    }
    try {
      const newStatus = tx.status === "completed" ? "pending" : "completed";
      await updateDoc(doc(db, "transactions", tx.id), {
        status: newStatus
      });
      // Update local state to reflect change immediately on dashboard
      setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o status do lançamento.");
    }
  };

  const currentMonth = format(new Date(), "MMMM", { locale: ptBR });

  // Filter by period
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredTransactions = transactions.filter((tx) => {
    if (periodFilter === "all_time") return true;
    
    // Calculate date
    const txDate = tx.date && typeof (tx.date as any).toDate === "function" 
      ? (tx.date as any).toDate() 
      : new Date(tx.date);
      
    return txDate.getMonth() === currentMonthNum && txDate.getFullYear() === currentYear;
  });

  // Calculate metrics
  const completedIncomes = filteredTransactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((acc, t) => acc + t.amount, 0);
  const completedExpenses = filteredTransactions
    .filter((t) => t.type === "expense" && t.status === "completed")
    .reduce((acc, t) => acc + t.amount, 0);
  const actualBalance = completedIncomes - completedExpenses;

  const incomes = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const predictedBalance = incomes - expenses;

  const saved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const pendingBills = filteredTransactions
    .filter((t) => t.status === "pending" && t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const safeToSpendDaily = Math.max(0, (actualBalance - pendingBills) / 30); // simplistic calculation

  const metrics = {
    actualBalance,
    predictedBalance,
    incomes,
    expenses,
    saved,
    pendingBills,
    safeToSpendDaily,
  };

  const displayName = userProfile?.displayName?.split(" ")[0] || "Usuário";

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/settings" title="Editar Perfil" className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity active:scale-95">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt={displayName} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white/10" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Boa noite, {displayName} 👋
            </h1>
            <p className="text-slate-400 text-sm">
              Resumo da {organization?.name || "sua casa"} em{" "}
              
              {periodFilter === "current_month" ? (
                <span>em <span className="capitalize">{currentMonth}</span>.</span>
              ) : (
                <span>em <strong>Todo o Período</strong>.</span>
              )}

            </p>
          </div>
        </div>
        </header>

      {/* Financial Overview Hero */}
      <div 
        onClick={() => navigate("/transactions")}
        className="bg-indigo-500 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden cursor-pointer hover:shadow-indigo-500/30 transition-shadow"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#151E2E]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-sky-100 font-medium mb-1 text-sm md:text-base">
            Total Atual
          </p>
          <div className="flex items-end gap-2 mb-6">
            <span className="text-3xl md:text-4xl font-bold tracking-tight">
              {formatCurrency(metrics.actualBalance)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={(e) => { e.stopPropagation(); navigate("/transactions", { state: { filter: "income" } }); }}
              className="bg-white/5 p-4 rounded-3xl backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                 <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                 <p className="text-sky-50 text-xs md:text-sm font-medium">Entradas</p>
              </div>
              <p className="text-lg md:text-xl font-bold">
                {formatCurrency(metrics.incomes)}
              </p>
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); navigate("/transactions", { state: { filter: "expense" } }); }}
              className="bg-white/5 p-4 rounded-3xl backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                 <ArrowDownRight className="w-4 h-4 text-rose-300" />
                 <p className="text-sky-50 text-xs md:text-sm font-medium">Saídas</p>
              </div>
              <p className="text-lg md:text-xl font-bold">
                {formatCurrency(metrics.expenses)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Financial Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => navigate("/transactions", { state: { filter: "pending" } })}
        >
          <CardContent className="p-4 md:p-5">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-3xl bg-amber-400/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">
              Pendentes
            </p>
            <h3 className="text-lg md:text-2xl font-bold text-white tracking-tight">
              {formatCurrency(metrics.pendingBills)}
            </h3>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow" 
          onClick={() => navigate("/goals")}
        >
          <CardContent className="p-4 md:p-5">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-3xl bg-indigo-400/10 flex items-center justify-center">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">
              Economia
            </p>
            <h3 className="text-lg md:text-2xl font-bold text-white tracking-tight">
              {formatCurrency(metrics.saved)}
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white">Últimos Lançamentos</h3>
            <Link
              to="/transactions"
              className="text-sm text-indigo-400 font-medium hover:text-sky-700"
            >
              Ver todos
            </Link>
          </div>
          <CardContent className="p-0 flex-1">
            {transactions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                Nenhum lançamento recente.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.slice(0, 3).map((tx, i) => (
                  <div
                    key={i}
                    onDoubleClick={() => toggleTransactionStatus(tx)}
                    className={`p-4 flex items-center justify-between transition-colors cursor-pointer select-none ${
                      tx.status === "completed"
                        ? tx.type === "expense"
                          ? "bg-rose-500/10 hover:bg-rose-500/15"
                          : "bg-emerald-500/10 hover:bg-emerald-500/15"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg shadow-inner">
                        {tx.emoji || (tx.type === "expense" ? "💸" : "💰")}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {tx.description}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {tx.date && typeof tx.date.toDate === "function"
                            ? tx.date.toDate().toLocaleDateString("pt-BR")
                            : new Date(tx.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-white"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}{" "}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white">Progresso das Metas</h3>
            <Link
              to="/goals"
              className="text-sm text-indigo-400 font-medium hover:text-sky-700"
            >
              Ver todas
            </Link>
          </div>
          <CardContent className="p-4 space-y-6 flex-1">
            {goals.length === 0 ? (
              <div className="text-center text-slate-400 text-sm h-full flex items-center justify-center">
                Nenhuma meta definida.
              </div>
            ) : (
              goals.slice(0, 2).map((goal, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{goal.emoji || "🎯"}</span>
                      <span className="font-medium text-slate-100">
                        {goal.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {" "}
                        / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {Math.round((goal.currentAmount / goal.targetAmount) * 100)}
                    % concluído
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
